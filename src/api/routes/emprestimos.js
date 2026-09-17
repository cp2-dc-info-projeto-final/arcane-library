var express = require('express');
var router = express.Router();

const pool = require('../db/config');
const { verifyToken, isAdmin } = require('../middlewares/auth');

function sendSuccess(res, status, message, data) {
  const payload = { success: true };

  if (message) {
    payload.message = message;
  }

  if (typeof data !== 'undefined') {
    payload.data = data;
  }

  return res.status(status).json(payload);
}

function sendError(res, status, message, errors = []) {
  return res.status(status).json({
    success: false,
    message,
    errors
  });
}

router.get('/', verifyToken, isAdmin, async function (req, res) {
  try {
    const consulta = req.query.consulta
      ? `%${req.query.consulta}%`
      : '%';

    const query = `
      SELECT
        e.id,
        e.id_usuario,
        u.login AS usuario,
        e.id_livro,
        l.titulo AS livro,
        e.data_de_emprestimo,
        e.data_fim_emprestimo,
        e.status_emprestimo
      FROM emprestimo e
      INNER JOIN usuario u
        ON u.id = e.id_usuario
      INNER JOIN livro l
        ON l.id = e.id_livro
      WHERE
        u.login ILIKE $1
        OR u.email ILIKE $1
        OR l.titulo ILIKE $1
      ORDER BY e.id
    `;

    const result = await pool.query(query, [consulta]);

    return sendSuccess(res, 200, null, result.rows);
  } catch (error) {
    console.error('Erro ao buscar empréstimos:', error);
    return sendError(res, 500, 'Erro interno do servidor');
  }
});

router.post('/', verifyToken, isAdmin, async function (req, res) {
  const client = await pool.connect();

  try {
    const {
      id_usuario,
      id_livro,
      data_de_emprestimo,
      data_fim_emprestimo,
      status_emprestimo
    } = req.body;

    if (!id_usuario) {
      return sendError(res, 400, 'ID do usuário é obrigatório.');
    }

    if (!id_livro) {
      return sendError(res, 400, 'ID do livro é obrigatório.');
    }

    const usuarioExists = await client.query(
      `SELECT id FROM usuario WHERE id = $1`,
      [id_usuario]
    );

    if (usuarioExists.rows.length === 0) {
      return sendError(res, 400, 'Usuário não encontrado.');
    }

    const livroExists = await client.query(
      `SELECT id FROM livro WHERE id = $1`,
      [id_livro]
    );

    if (livroExists.rows.length === 0) {
      return sendError(res, 400, 'Livro não encontrado.');
    }

    const statusFinal = status_emprestimo || 'ativo';

    if (!['ativo', 'devolvido', 'atrasado'].includes(statusFinal)) {
      return sendError(res, 400, 'Status de empréstimo inválido.');
    }

    await client.query('BEGIN');

    const result = await client.query(
      `
        INSERT INTO emprestimo (
          id_usuario,
          id_livro,
          data_de_emprestimo,
          data_fim_emprestimo,
          status_emprestimo
        )
        VALUES (
          $1,
          $2,
          COALESCE($3, CURRENT_TIMESTAMP),
          $4,
          $5
        )
        RETURNING
          id,
          id_usuario,
          id_livro,
          data_de_emprestimo,
          data_fim_emprestimo,
          status_emprestimo
      `,
      [
        id_usuario,
        id_livro,
        data_de_emprestimo || null,
        data_fim_emprestimo || null,
        statusFinal
      ]
    );

    await client.query('COMMIT');

    return sendSuccess(
      res,
      201,
      'Empréstimo cadastrado com sucesso',
      result.rows[0]
    );
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Erro ao cadastrar empréstimo:', error);
    return sendError(res, 500, 'Erro interno do servidor');
  } finally {
    client.release();
  }
});

router.get('/:id', verifyToken, isAdmin, async function (req, res) {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `
        SELECT
          e.id,
          e.id_usuario,
          u.login AS usuario,
          u.email AS email_usuario,
          e.id_livro,
          l.titulo AS livro,
          e.data_de_emprestimo,
          e.data_fim_emprestimo,
          e.status_emprestimo
        FROM emprestimo e
        INNER JOIN usuario u
          ON u.id = e.id_usuario
        INNER JOIN livro l
          ON l.id = e.id_livro
        WHERE e.id = $1
      `,
      [id]
    );

    if (result.rows.length === 0) {
      return sendError(res, 404, 'Empréstimo não encontrado.');
    }

    return sendSuccess(res, 200, null, result.rows[0]);
  } catch (error) {
    console.error('Erro ao buscar empréstimo:', error);
    return sendError(res, 500, 'Erro interno do servidor');
  }
});

router.put('/:id', verifyToken, isAdmin, async function (req, res) {
  const client = await pool.connect();

  try {
    const { id } = req.params;

    const {
      id_usuario,
      id_livro,
      data_de_emprestimo,
      data_fim_emprestimo,
      status_emprestimo
    } = req.body;

    const emprestimoExists = await client.query(
      `SELECT id FROM emprestimo WHERE id = $1`,
      [id]
    );

    if (emprestimoExists.rows.length === 0) {
      return sendError(res, 404, 'Empréstimo não encontrado.');
    }

    if (!id_usuario) {
      return sendError(res, 400, 'ID do usuário é obrigatório.');
    }

    const usuarioExists = await client.query(
      `SELECT id FROM usuario WHERE id = $1`,
      [id_usuario]
    );

    if (usuarioExists.rows.length === 0) {
      return sendError(res, 400, 'Usuário não encontrado.');
    }

    if (!id_livro) {
      return sendError(res, 400, 'ID do livro é obrigatório.');
    }

    const livroExists = await client.query(
      `SELECT id FROM livro WHERE id = $1`,
      [id_livro]
    );

    if (livroExists.rows.length === 0) {
      return sendError(res, 400, 'Livro não encontrado.');
    }

    if (!['ativo', 'devolvido', 'atrasado'].includes(status_emprestimo)) {
      return sendError(res, 400, 'Status de empréstimo inválido.');
    }

    await client.query('BEGIN');

    await client.query(
      `
        UPDATE emprestimo
        SET
          id_usuario = $1,
          id_livro = $2,
          data_de_emprestimo = $3,
          data_fim_emprestimo = $4,
          status_emprestimo = $5
        WHERE id = $6
      `,
      [
        id_usuario,
        id_livro,
        data_de_emprestimo,
        data_fim_emprestimo || null,
        status_emprestimo,
        id
      ]
    );

    await client.query('COMMIT');

    const atualizado = await pool.query(
      `
        SELECT
          e.id,
          e.id_usuario,
          u.login AS usuario,
          u.email AS email_usuario,
          e.id_livro,
          l.titulo AS livro,
          e.data_de_emprestimo,
          e.data_fim_emprestimo,
          e.status_emprestimo
        FROM emprestimo e
        INNER JOIN usuario u
          ON u.id = e.id_usuario
        INNER JOIN livro l
          ON l.id = e.id_livro
        WHERE e.id = $1
      `,
      [id]
    );

    return sendSuccess(
      res,
      200,
      'Empréstimo atualizado com sucesso',
      atualizado.rows[0]
    );
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Erro ao atualizar empréstimo:', error);
    return sendError(res, 500, 'Erro interno do servidor');
  } finally {
    client.release();
  }
});

router.delete('/:id', verifyToken, isAdmin, async function (req, res) {
  try {
    const { id } = req.params;

    const emprestimoExists = await pool.query(
      `SELECT id FROM emprestimo WHERE id = $1`,
      [id]
    );

    if (emprestimoExists.rows.length === 0) {
      return sendError(res, 404, 'Empréstimo não encontrado.');
    }

    await pool.query(
      `DELETE FROM emprestimo WHERE id = $1`,
      [id]
    );

    return sendSuccess(
      res,
      200,
      'Empréstimo deletado com sucesso'
    );
  } catch (error) {
    console.error('Erro ao deletar empréstimo:', error);
    return sendError(res, 500, 'Erro interno do servidor');
  }
});

module.exports = router;