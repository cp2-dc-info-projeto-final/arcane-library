
var express = require('express');
var router = express.Router();
const pool = require('../db/config');
const { verifyToken, isAdmin } = require('../middlewares/auth');

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

/* GET - Buscar todas as categorias
   Qualquer usuário autenticado pode consultar */
router.get('/', verifyToken, async function(req, res) {
  try {
    const consulta = req.query.consulta
      ? '%' + req.query.consulta + '%'
      : '%';

    const result = await pool.query(
      `SELECT id_categorias, nome
       FROM categorias
       WHERE nome LIKE $1
       ORDER BY nome ASC`,
      [consulta]
    );

    return sendSuccess(res, 200, null, result.rows);
  } catch (error) {
    console.error('Erro ao buscar categorias:', error);
    return sendError(res, 500, 'Erro interno do servidor');
  }
});

/* POST - Criar nova categoria
   Somente administradores */
router.post('/', verifyToken, isAdmin, async function(req, res) {
  try {
    const { nome } = req.body;

    if (!nome || !nome.trim()) {
      return sendError(res, 400, 'O nome da categoria é obrigatório');
    }

    const result = await pool.query(
      `INSERT INTO categorias (nome)
       VALUES ($1)
       RETURNING id_categorias, nome`,
      [nome.trim()]
    );

    return sendSuccess(
      res,
      201,
      'Categoria criada com sucesso',
      result.rows[0]
    );
  } catch (error) {
    console.error('Erro ao criar categoria:', error);

    if (error.code === '23514') {
      return sendError(
        res,
        400,
        'Dados inválidos. Verifique os campos e tente novamente.'
      );
    }

    return sendError(res, 500, 'Erro interno do servidor');
  }
});

/* GET parametrizado - Buscar categoria por ID
   Mantido restrito aos administradores */
router.get('/:id', verifyToken, isAdmin, async function(req, res) {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT id_categorias, nome
       FROM categorias
       WHERE id_categorias = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return sendError(res, 404, 'Categoria não encontrada');
    }

    return sendSuccess(res, 200, null, result.rows[0]);
  } catch (error) {
    console.error('Erro ao buscar categoria:', error);
    return sendError(res, 500, 'Erro interno do servidor');
  }
});

/* PUT - Atualizar categoria
   Somente administradores */
router.put('/:id', verifyToken, isAdmin, async function(req, res) {
  try {
    const { id } = req.params;
    const { nome } = req.body;

    if (!nome || !nome.trim()) {
      return sendError(res, 400, 'O nome da categoria é obrigatório');
    }

    const result = await pool.query(
      `UPDATE categorias
       SET nome = $1
       WHERE id_categorias = $2
       RETURNING id_categorias, nome`,
      [nome.trim(), id]
    );

    if (result.rows.length === 0) {
      return sendError(res, 404, 'Categoria não encontrada');
    }

    return sendSuccess(
      res,
      200,
      'Categoria atualizada com sucesso',
      result.rows[0]
    );
  } catch (error) {
    console.error('Erro ao atualizar categoria:', error);

    if (error.code === '23514') {
      return sendError(
        res,
        400,
        'Dados inválidos. Verifique os campos e tente novamente.'
      );
    }

    return sendError(res, 500, 'Erro interno do servidor');
  }
});

/* DELETE - Remover categoria
   Somente administradores */
router.delete('/:id', verifyToken, isAdmin, async function(req, res) {
  try {
    const { id } = req.params;

    const categoriasExists = await pool.query(
      `SELECT id_categorias
       FROM categorias
       WHERE id_categorias = $1`,
      [id]
    );

    if (categoriasExists.rows.length === 0) {
      return sendError(res, 404, 'Categoria não encontrada');
    }

    await pool.query(
      'DELETE FROM categorias WHERE id_categorias = $1',
      [id]
    );

    return sendSuccess(
      res,
      200,
      'Categoria deletada com sucesso'
    );
  } catch (error) {
    console.error('Erro ao deletar categoria:', error);
    return sendError(res, 500, 'Erro interno do servidor');
  }
});

module.exports = router;
