
var express = require('express');
var router = express.Router();

const pool = require('../db/config');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const upload = require('../middlewares/upload');
const { verifyToken, isAdmin } = require('../middlewares/auth');

// Respostas padronizadas
function sendSuccess(res, status, message, data) {
  const payload = { success: true };

  if (message) payload.message = message;
  if (typeof data !== 'undefined') payload.data = data;

  return res.status(status).json(payload);
}

function sendError(res, status, message, errors = []) {
  return res.status(status).json({
    success: false,
    message,
    errors
  });
}

// Remove a máscara do CPF
function limparCPF(cpf) {
  return String(cpf || '').replace(/\D/g, '');
}

// Trata conflitos de unicidade
function tratarErroBanco(error, res, operacao) {
  console.error(`Erro ao ${operacao}:`, error);

  if (error.code === '23505') {
    const campo = error.constraint?.includes('email')
      ? 'email'
      : error.constraint?.includes('cpf')
        ? 'cpf'
        : 'login';

    return sendError(res, 409, 'Já existe um cadastro com esses dados.', [
      {
        field: campo,
        message: `${campo} já está em uso.`,
        code: 'CONFLICT'
      }
    ]);
  }

  if (error.code === '23514' || error.code === '22P02' || error.code === '22007') {
    return sendError(res, 400, 'Dados inválidos. Verifique os campos e tente novamente.');
  }

  return sendError(res, 500, 'Erro interno do servidor');
}

const camposUsuario = `
  id,
  foto,
  login,
  email,
  TO_CHAR(datanasc, 'YYYY-MM-DD') AS datanasc,
  cpf,
  telefone,
  role
`;

/* =====================================================
   GET - Buscar todos os usuários
   Apenas administrador
===================================================== */

router.get('/', verifyToken, isAdmin, async function(req, res) {
  try {
    const consulta = req.query.consulta
      ? `%${req.query.consulta}%`
      : '%';

    const result = await pool.query(
      `SELECT ${camposUsuario}
       FROM usuario
       WHERE login ILIKE $1
       ORDER BY id`,
      [consulta]
    );

    return sendSuccess(res, 200, null, result.rows);

  } catch (error) {
    return tratarErroBanco(error, res, 'buscar usuários');
  }
});

/* =====================================================
   GET - Buscar próprio usuário
===================================================== */

router.get('/me', verifyToken, async function(req, res) {
  try {
    const id = req.user.id;

    const result = await pool.query(
      `SELECT ${camposUsuario}
       FROM usuario
       WHERE id = $1::BIGINT`,
      [id]
    );

    if (result.rows.length === 0) {
      return sendError(res, 404, 'Usuário não encontrado');
    }

    return sendSuccess(res, 200, null, result.rows[0]);

  } catch (error) {
    return tratarErroBanco(error, res, 'buscar usuário');
  }
});

/* =====================================================
   POST - Criar usuário
===================================================== */

router.post('/', upload.single('foto'), async function(req, res) {
  try {
    const {
      login,
      email,
      cpf,
      telefone,
      datanasc,
      senha
    } = req.body;

    const cpfLimpo = limparCPF(cpf);

    // Validação obrigatória
    const errors = [];

    if (!login?.trim()) {
      errors.push({
        field: 'login',
        message: 'Login é obrigatório',
        code: 'REQUIRED'
      });
    }

    if (!email?.trim()) {
      errors.push({
        field: 'email',
        message: 'Email é obrigatório',
        code: 'REQUIRED'
      });
    }

    if (!senha) {
      errors.push({
        field: 'senha',
        message: 'Senha é obrigatória',
        code: 'REQUIRED'
      });
    } else if (senha.length < 6) {
      errors.push({
        field: 'senha',
        message: 'A senha deve ter pelo menos 6 caracteres.',
        code: 'INVALID'
      });
    }

    if (cpfLimpo.length !== 11) {
      errors.push({
        field: 'cpf',
        message: 'O CPF deve conter 11 dígitos.',
        code: 'INVALID'
      });
    }

    if (!telefone) {
      errors.push({
        field: 'telefone',
        message: 'Telefone é obrigatório',
        code: 'REQUIRED'
      });
    }

    if (!datanasc) {
      errors.push({
        field: 'datanasc',
        message: 'Data de nascimento é obrigatória',
        code: 'REQUIRED'
      });
    }

    if (errors.length > 0) {
      return sendError(res, 400, 'Verifique os dados informados.', errors);
    }

    // Verificar login existente
    const existingUser = await pool.query(
      'SELECT id FROM usuario WHERE login = $1',
      [login.trim()]
    );

    if (existingUser.rows.length > 0) {
      return sendError(res, 409, 'Login já está em uso', [
        {
          field: 'login',
          message: 'Login já está em uso',
          code: 'CONFLICT'
        }
      ]);
    }

    // Verificar email existente
    const existingEmail = await pool.query(
      'SELECT id FROM usuario WHERE email = $1',
      [email.trim()]
    );

    if (existingEmail.rows.length > 0) {
      return sendError(res, 409, 'Email já está em uso', [
        {
          field: 'email',
          message: 'Email já está em uso',
          code: 'CONFLICT'
        }
      ]);
    }

    // Criptografar senha
    const hashedPassword = await bcrypt.hash(senha, 12);

    const foto = req.file ? req.file.filename : null;

    // Usuários cadastrados publicamente recebem perfil cliente.
    // Não confiar no role enviado pelo frontend.
    const role = 'cliente';

    const result = await pool.query(
      `INSERT INTO usuario (
        foto,
        login,
        email,
        senha,
        datanasc,
        cpf,
        telefone,
        role
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING ${camposUsuario}`,
      [
        foto,
        login.trim(),
        email.trim(),
        hashedPassword,
        datanasc,
        cpfLimpo,
        telefone,
        role
      ]
    );

    return sendSuccess(
      res,
      201,
      'Usuário criado com sucesso',
      result.rows[0]
    );

  } catch (error) {
    return tratarErroBanco(error, res, 'criar usuário');
  }
});

/* =====================================================
   POST - Autenticar usuário
===================================================== */

router.post('/login', async function(req, res) {
  try {
    const { login, password } = req.body;

    if (!login || !password) {
      return sendError(res, 400, 'Login e senha são obrigatórios.');
    }

    const result = await pool.query(
      `SELECT
        id,
        foto,
        login,
        email,
        senha AS password_hash,
        TO_CHAR(datanasc, 'YYYY-MM-DD') AS datanasc,
        cpf,
        telefone,
        role
       FROM usuario
       WHERE login = $1`,
      [login]
    );

    if (result.rows.length === 0) {
      return sendError(res, 401, 'Credenciais inválidas');
    }

    const user = result.rows[0];

    const isMatch = await bcrypt.compare(
      password,
      user.password_hash
    );

    if (!isMatch) {
      return sendError(res, 401, 'Credenciais inválidas');
    }

    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET não configurado.');
      return sendError(res, 500, 'Erro interno do servidor');
    }

    const token = jwt.sign(
      {
        id: user.id,
        foto: user.foto,
        login: user.login,
        email: user.email,
        datanasc: user.datanasc,
        cpf: user.cpf,
        telefone: user.telefone,
        role: user.role
      },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    return sendSuccess(res, 200, 'Autenticado com sucesso!', {
      token
    });

  } catch (error) {
    return tratarErroBanco(error, res, 'autenticar usuário');
  }
});

/* =====================================================
   PUT - Atualizar próprio usuário
===================================================== */

router.put('/me', verifyToken, upload.single('foto'), async function(req, res) {
  try {
    console.log('========== FOTO RECEBIDA ==========');
    console.log('req.file:', req.file);
    console.log('req.body:', req.body);
    console.log('===================================');
    const id = req.user.id;

    const {
      login,
      email,
      datanasc,
      cpf,
      telefone,
      senha
    } = req.body;

    const cpfLimpo = limparCPF(cpf);
    const foto = req.file ? req.file.filename : null;

    if (!login?.trim() || !email?.trim() || cpfLimpo.length !== 11 ||
        !telefone || !datanasc) {
      return sendError(res, 400, 'Verifique os campos obrigatórios.');
    }

    // Verificar login de outro usuário
    const existingUser = await pool.query(
      'SELECT id FROM usuario WHERE login = $1 AND id != $2::BIGINT',
      [login.trim(), id]
    );

    if (existingUser.rows.length > 0) {
      return sendError(res, 409, 'Login já está em uso', [
        { field: 'login', message: 'Login já está em uso', code: 'CONFLICT' }
      ]);
    }

    // Verificar email de outro usuário
    const existingEmail = await pool.query(
      'SELECT id FROM usuario WHERE email = $1 AND id != $2::BIGINT',
      [email.trim(), id]
    );

    if (existingEmail.rows.length > 0) {
      return sendError(res, 409, 'Email já está em uso', [
        { field: 'email', message: 'Email já está em uso', code: 'CONFLICT' }
      ]);
    }

    let result;

    if (senha && senha.trim() !== '') {
      if (senha.length < 6) {
        return sendError(res, 400, 'A senha deve ter pelo menos 6 caracteres.', [
          { field: 'senha', message: 'Mínimo de 6 caracteres.', code: 'INVALID' }
        ]);
      }

      const hashedPassword = await bcrypt.hash(senha, 12);

      result = await pool.query(
        `UPDATE usuario
         SET foto = COALESCE($1, foto),
             login = $2,
             email = $3,
             senha = $4,
             datanasc = $5,
             cpf = $6,
             telefone = $7
         WHERE id = $8::BIGINT
         RETURNING ${camposUsuario}`,
        [
          foto,
          login.trim(),
          email.trim(),
          hashedPassword,
          datanasc,
          cpfLimpo,
          telefone,
          id
        ]
      );

    } else {
      result = await pool.query(
        `UPDATE usuario
         SET foto = COALESCE($1, foto),
             login = $2,
             email = $3,
             datanasc = $4,
             cpf = $5,
             telefone = $6
         WHERE id = $7::BIGINT
         RETURNING ${camposUsuario}`,
        [
          foto,
          login.trim(),
          email.trim(),
          datanasc,
          cpfLimpo,
          telefone,
          id
        ]
      );
    }

    if (result.rows.length === 0) {
      return sendError(res, 404, 'Usuário não encontrado');
    }

    return sendSuccess(res, 200, 'Usuário atualizado com sucesso', result.rows[0]);

  } catch (error) {
    return tratarErroBanco(error, res, 'atualizar usuário');
  }
});

/* =====================================================
   DELETE - Remover próprio usuário
===================================================== */

router.delete('/me', verifyToken, async function(req, res) {
  try {
    const id = req.user.id;

    const result = await pool.query(
      'DELETE FROM usuario WHERE id = $1::BIGINT RETURNING id',
      [id]
    );

    if (result.rows.length === 0) {
      return sendError(res, 404, 'Usuário não encontrado');
    }

    return sendSuccess(res, 200, 'Usuário deletado com sucesso');

  } catch (error) {
    return tratarErroBanco(error, res, 'deletar usuário');
  }
});

/* =====================================================
   GET - Buscar usuário por ID
   Apenas administrador
===================================================== */

router.get('/:id', verifyToken, isAdmin, async function(req, res) {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT ${camposUsuario}
       FROM usuario
       WHERE id = $1::BIGINT`,
      [id]
    );

    if (result.rows.length === 0) {
      return sendError(res, 404, 'Usuário não encontrado');
    }

    return sendSuccess(res, 200, null, result.rows[0]);

  } catch (error) {
    return tratarErroBanco(error, res, 'buscar usuário');
  }
});

/* =====================================================
   PUT - Atualizar usuário por ID
   Apenas administrador
===================================================== */

router.put('/:id', verifyToken, isAdmin, upload.single('foto'), async function(req, res) {
  try {
    const { id } = req.params;

    const {
      login,
      email,
      senha,
      datanasc,
      cpf,
      telefone,
      role
    } = req.body;

    const cpfLimpo = limparCPF(cpf);
    const foto = req.file ? req.file.filename : null;

    if (!login?.trim() || !email?.trim() || !role ||
        cpfLimpo.length !== 11 || !telefone || !datanasc) {
      return sendError(res, 400, 'Verifique os campos obrigatórios.');
    }

    if (!['cliente', 'admin'].includes(role)) {
      return sendError(res, 400, 'Perfil de usuário inválido.');
    }

    // Verificar existência
    const userExists = await pool.query(
      'SELECT id FROM usuario WHERE id = $1::BIGINT',
      [id]
    );

    if (userExists.rows.length === 0) {
      return sendError(res, 404, 'Usuário não encontrado');
    }

    // Verificar login duplicado
    const existingUser = await pool.query(
      'SELECT id FROM usuario WHERE login = $1 AND id != $2::BIGINT',
      [login.trim(), id]
    );

    if (existingUser.rows.length > 0) {
      return sendError(res, 409, 'Login já está em uso por outro usuário', [
        { field: 'login', message: 'Login já está em uso', code: 'CONFLICT' }
      ]);
    }

    // Verificar email duplicado
    const existingEmail = await pool.query(
      'SELECT id FROM usuario WHERE email = $1 AND id != $2::BIGINT',
      [email.trim(), id]
    );

    if (existingEmail.rows.length > 0) {
      return sendError(res, 409, 'Email já está em uso por outro usuário', [
        { field: 'email', message: 'Email já está em uso', code: 'CONFLICT' }
      ]);
    }

    let result;

    if (senha && senha.trim() !== '') {
      if (senha.length < 6) {
        return sendError(res, 400, 'A senha deve ter pelo menos 6 caracteres.', [
          { field: 'senha', message: 'Mínimo de 6 caracteres.', code: 'INVALID' }
        ]);
      }

      const hashedPassword = await bcrypt.hash(senha, 12);

      result = await pool.query(
        `UPDATE usuario
         SET foto = COALESCE($1, foto),
             login = $2,
             email = $3,
             senha = $4,
             datanasc = $5,
             cpf = $6,
             telefone = $7,
             role = $8
         WHERE id = $9::BIGINT
         RETURNING ${camposUsuario}`,
        [
          foto,
          login.trim(),
          email.trim(),
          hashedPassword,
          datanasc,
          cpfLimpo,
          telefone,
          role,
          id
        ]
      );

    } else {
      result = await pool.query(
        `UPDATE usuario
         SET foto = COALESCE($1, foto),
             login = $2,
             email = $3,
             datanasc = $4,
             cpf = $5,
             telefone = $6,
             role = $7
         WHERE id = $8::BIGINT
         RETURNING ${camposUsuario}`,
        [
          foto,
          login.trim(),
          email.trim(),
          datanasc,
          cpfLimpo,
          telefone,
          role,
          id
        ]
      );
    }

    return sendSuccess(res, 200, 'Usuário atualizado com sucesso', result.rows[0]);

  } catch (error) {
    return tratarErroBanco(error, res, 'atualizar usuário');
  }
});

/* =====================================================
   DELETE - Remover usuário por ID
   Apenas administrador
===================================================== */

router.delete('/:id', verifyToken, isAdmin, async function(req, res) {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'DELETE FROM usuario WHERE id = $1::BIGINT RETURNING id',
      [id]
    );

    if (result.rows.length === 0) {
      return sendError(res, 404, 'Usuário não encontrado');
    }

    return sendSuccess(res, 200, 'Usuário deletado com sucesso');

  } catch (error) {
    return tratarErroBanco(error, res, 'deletar usuário');
  }
});

module.exports = router;
