var express = require('express');
var router = express.Router();
const pool = require('../db/config');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { verifyToken, isAdmin, isIdUser } = require('../middlewares/auth');

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

/* GET - Buscar todos os usuários */
// requer usuário autenticado como admin
router.get('/', verifyToken, isAdmin, async function(req, res) {
  try {
    const consulta = req.query.consulta ? '%'+req.query.consulta+'%' : '%';
    const result = await pool.query('SELECT id, login, email, datanasc, cpf, telefone, role FROM usuario WHERE login LIKE $1 ORDER BY id', [consulta]);
    return sendSuccess(res, 200, null, result.rows);
  } catch (error) {
    console.error('Erro ao buscar usuários:', error);
    return sendError(res, 500, 'Erro interno do servidor');
  }
});

/* GET parametrizado - Buscar usuário autenticado */
router.get('/me', verifyToken, async function(req, res) {
  try {
    // parâmetro obtido do token pelo middleware
    const id = req.user.id;
    const result = await pool.query('SELECT id, login, email, TO_CHAR(datanasc, \'YYYY-MM-DD\') as datanasc, cpf, telefone, role FROM usuario WHERE id = $1', [id]);
    

    if (result.rows.length === 0) {
      return sendError(res, 404, 'Usuário não encontrado');
    }

    return sendSuccess(res, 200, null, result.rows[0]);
  } catch (error) {
    console.error('Erro ao buscar usuário:', error);
    return sendError(res, 500, 'Erro interno do servidor');
  }
});

/* GET parametrizado - Buscar usuário por ID */
router.get('/:id', verifyToken, isAdmin, async function(req, res) {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT id, login, email, datanasc, cpf, telefone, role FROM usuario WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return sendError(res, 404, 'Usuário não encontrado');
    }
    console.log(result.rows[0]);
    return sendSuccess(res, 200, null, result.rows[0]);
  } catch (error) {
    console.error('Erro ao buscar usuário:', error);
    return sendError(res, 500, 'Erro interno do servidor');
  }
});

/* POST - Criar novo usuário */
router.post('/', async function(req, res) {
  try {
    const { login, email, cpf, telefone, datanasc, senha, role = 'user' } = req.body;
    
    console.log(req.body);

    // Validação básica
    if (!login || !email || !senha ) {
      const errors = [];
      if (!login) errors.push({ field: 'login', message: 'Login é obrigatório', code: 'REQUIRED' });
      if (!email) errors.push({ field: 'email', message: 'Email é obrigatório', code: 'REQUIRED' });
      if (!senha) errors.push({ field: 'senha', message: 'Senha é obrigatória', code: 'REQUIRED' });

      return sendError(res, 400, 'Login, email e senha são obrigatórios', errors);
      console.log('cleberson')
    }
    
    // Verificar se o login já existe
    const existingUser = await pool.query('SELECT id FROM usuario WHERE login = $1', [login]);
    if (existingUser.rows.length > 0) {
      return sendError(res, 409, 'Login já está em uso', [
        { field: 'login', message: 'Login já está em uso', code: 'CONFLICT' }
      ]);
    }

    // Verificar se o email já existe
    const existingEmail = await pool.query('SELECT id FROM usuario WHERE email = $1', [email]);
    if (existingEmail.rows.length > 0) {
      return sendError(res, 409, 'Email já está em uso', [
        { field: 'email', message: 'Email já está em uso', code: 'CONFLICT' }
      ]);
    }

    // Hash da senha
    const hashedPassword = await bcrypt.hash(senha, 12);

    const result = await pool.query(
      'INSERT INTO usuario (login, email, senha, datanasc, cpf, telefone, role) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id, login, email, datanasc, cpf, telefone, role',
      [login, email, hashedPassword, datanasc, cpf, telefone, role]
    );

    return sendSuccess(res, 201, 'Usuário criado com sucesso', result.rows[0]);
  } catch (error) {
    console.error('Erro ao criar usuário:', error);
    // Verificar se é erro de constraint
    if (error.code === '23514') {
      return sendError(res, 400, 'Dados inválidos. Verifique os campos e tente novamente.');
    }
    return sendError(res, 500, 'Erro interno do servidor');
  }
});


/* POST - Autenticar usuário */
router.post('/login', async function(req, res) {
  try {
    const { login, password } = req.body;
    // obtém o usuário do banco de dados
    const result = await pool.query(`SELECT 
      id, login, email, senha as passwordHash, datanasc, cpf, telefone, role
      FROM usuario 
      WHERE login = $1`, [login]);

    /* 
     tratar login inválido igual senha incorreta
     confere maior segurança por não expor indiretamente
     se existe uma conta com aquele login 
    */
    if (result.rows.length === 0) {
      return sendError(res, 401, 'Credenciais inválidas');
    }

    // Objeto de usuário
    const user = result.rows[0];

    /*
     verifica a senha passando senha do forntend e hash armazenada
     a partir da hash não se pode descobrir a senha
     mas fornecendo a senha dá para aplicar a hash e ver coincidem
    */
    
    bcrypt.compare(password, user.passwordhash, (err, isMatch) => {
      if (err) {
        console.error('Erro no bcrypt:', err);
        return sendError(res, 500, 'Erro interno do servidor');
      }
      
      if (!isMatch) {
        return sendError(res, 401, 'Credenciais inválidas');
      }

      // Cria o token com as informações do usuário logado e sua chave pública
      const token = jwt.sign(
        { 
          id: user.id, 
          login: user.login,
          email: user.email,
          datanasc: user.datanasc,
          cpf: user.cpf,
          telefone: user.telefone,
          
          // tipo do usuário, que vem do banco
          role: user.role 
          // a senha não entra no token para não ser exposta
        }, 
        process.env.JWT_SECRET, //chave secreta, nunca exponha!! >>> PERIGO <<<
        { expiresIn: '1h' } 
      );

      return sendSuccess(res, 200, 'Autenticado com sucesso!', { token });
    });

  } catch (error) {
    console.error('Erro ao autenticar usuário:', error);
    return sendError(res, 500, 'Erro interno do servidor');
  }
  
});

/* PUT - Atualizar o próprio usuário */
router.put('/me', verifyToken, isIdUser, async function(req, res) {
  console.log('CLEITONNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNN');
  console.log(req.body);
  try {
      const { id, login, email, datanasc, cpf, telefone, role, senha} = req.body;
    
    if (senha && senha.trim() !== '') {
      // Atualizar com nova senha
      const hashedPassword = await bcrypt.hash(senha, 12);
      query = 'UPDATE usuario SET login = $1, email = $2, senha = $3, datanasc = $4, cpf = $5, telefone = $6 WHERE id = $7 RETURNING id, login, email, datanasc, cpf, telefone ';
      params = [login, email, hashedPassword, datanasc, cpf, telefone, id];
    } else {
      // Atualizar sem alterar senha
      query = 'UPDATE usuario SET login = $1, email = $2, datanasc = $3, cpf = $4, telefone = $5 WHERE id = $6 RETURNING id, login, cpf, telefone, datanasc, email';
      params = [login, email, datanasc, cpf, telefone, id];
    }
    const result = await pool.query(
    query, params
    );
    return sendSuccess(res, 200, 'Usuário atualizado com sucesso', result.rows[0]);
  } catch (error) {
    console.error('Erro ao atualizar usuário:', error);
    // Verificar se é erro de constraint
    if (error.code === '23514') {
      return sendError(res, 400, 'Dados inválidos. Verifique os campos e tente novamente.');
    }
    return sendError(res, 500, 'Erro interno do servidor');
  }
});

/* PUT - Atualizar usuário */
router.put('/:id', verifyToken, isAdmin, async function(req, res) {
  console.log('aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa')
  try {
    const { id } = req.params;
    const { login, email, senha, datanasc, cpf, telefone, role } = req.body;
    
    // Validação básica
    if (!login || !email || !role) {
      const errors = [];
      if (!login) errors.push({ field: 'login', message: 'Login é obrigatório', code: 'REQUIRED' });
      if (!email) errors.push({ field: 'email', message: 'Email é obrigatório', code: 'REQUIRED' });
      if (!role) errors.push({ field: 'role', message: 'Role é obrigatório', code: 'REQUIRED' });

      return sendError(res, 400, 'Login, email e role são obrigatórios', errors);
    }
    
    // Verificar se o usuário existe
    const userExists = await pool.query('SELECT id FROM usuario WHERE id = $1', [id]);
    if (userExists.rows.length === 0) {
      return sendError(res, 404, 'Usuário não encontrado');
    }
    
    // Verificar se o login já está em uso por outro usuário
    const existingUser = await pool.query('SELECT id FROM usuario WHERE login = $1 AND id != $2', [login, id]);
    if (existingUser.rows.length > 0) {
      return sendError(res, 409, 'Login já está em uso por outro usuário', [
        { field: 'login', message: 'Login já está em uso por outro usuário', code: 'CONFLICT' }
      ]);
    }

    // Verificar se o email já está em uso por outro usuário
    const existingEmail = await pool.query('SELECT id FROM usuario WHERE email = $1 AND id != $2', [email, id]);
    if (existingEmail.rows.length > 0) {
      return sendError(res, 409, 'Email já está em uso por outro usuário', [
        { field: 'email', message: 'Email já está em uso por outro usuário', code: 'CONFLICT' }
      ]);
    }
    
    let query, params;
    
    if (senha && senha.trim() !== '') {
      // Atualizar com nova senha
      const hashedPassword = await bcrypt.hash(senha, 12);
      query = 'UPDATE usuario SET login = $1, email = $2, senha = %3, datanasc = $4, cpf = %5, telefone = $6, role = $7 WHERE id = $8 RETURNING id, login, email, cpf, datanasc, telefone, role';
      params = [login, email, hashedPassword, datanasc, cpf, telefone,  role, id];
    } else {
      // Atualizar sem alterar senha
      query = 'UPDATE usuario SET login = $1, email = $2, datanasc = $3, cpf = $4, telefone = $5, role = $6 WHERE id = $7 RETURNING id, login, email, cpf, datanasc, telefone, role';
      params = [login, email, datanasc, cpf, telefone, role, id];
    }
    
    const result = await pool.query(query, params);
    
    return sendSuccess(res, 200, 'Usuário atualizado com sucesso', result.rows[0]);
  } catch (error) {
    console.error('Erro ao atualizar usuário:', error);
    // Verificar se é erro de constraint
    if (error.code === '23514') {
      return sendError(res, 400, 'Dados inválidos. Verifique os campos e tente novamente.');
    }
    return sendError(res, 500, 'Erro interno do servidor');
  }
});

/* DELETE - Remover usuário */
router.delete('/:id', verifyToken, isAdmin, async function(req, res) {
  try {
    const { id } = req.params;
    
    // Verificar se o usuário existe
    const userExists = await pool.query('SELECT id FROM usuario WHERE id = $1', [id]);
    if (userExists.rows.length === 0) {
      return sendError(res, 404, 'Usuário não encontrado');
    }
    
    await pool.query('DELETE FROM usuario WHERE id = $1', [id]);
    
    return sendSuccess(res, 200, 'Usuário deletado com sucesso');
  } catch (error) {
    console.error('Erro ao deletar usuário:', error);
    return sendError(res, 500, 'Erro interno do servidor');
  }
});

/* DELETE - Remover usuário */
router.delete('/me', verifyToken, async function(req, res) {
  try {
    const id = req.user.id;
    const result = await pool.query('SELECT id = $1', [id]);
    // Verificar se o usuário existe
    const userExists = await pool.query('SELECT id FROM usuario WHERE id = $1', [id]);
    if (userExists.rows.length === 0) {
      return sendError(res, 404, 'Usuário não encontrado');
    }
    
    await pool.query('DELETE FROM usuario WHERE id = $1', [id]);
    
    return sendSuccess(res, 200, 'Usuário deletado com sucesso');
  } catch (error) {
    console.error('Erro ao deletar usuário:', error);
    return sendError(res, 500, 'Erro interno do servidor');
  }
});


module.exports = router;