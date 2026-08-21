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

/* GET - Buscar todos os autores */
router.get('/', verifyToken, isAdmin, async function(req, res) {
  try {
    const consulta = req.query.consulta ? '%'+req.query.consulta+'%' : '%';
    const result = await pool.query(
      "SELECT id, nome, pseunonimo FROM autor WHERE nome LIKE $1 ORDER BY id",
      [consulta]
    );
    return sendSuccess(res, 200, null, result.rows);
  } catch (error) {
    console.error('Erro ao buscar autores:', error);
    return sendError(res, 500, 'Erro interno do servidor');
  }
});

/* POST - Criar novo autor */
router.post('/', verifyToken, isAdmin, async function(req, res) {
  try {
    const { nome, pseunonimo } = req.body;
    
    if (!nome || nome.trim() === '') {
      return sendError(res, 400, 'O nome do autor é obrigatório');
    }

    const result = await pool.query(
      "INSERT INTO autor (nome, pseunonimo) VALUES ($1, $2) RETURNING id, nome, pseunonimo",
      [nome, pseunonimo || null]
    );

    return sendSuccess(res, 201, 'Autor criado com sucesso', result.rows[0]);
  } catch (error) {
    console.error('Erro ao criar autor:', error);
    if (error.code === '23514') {
      return sendError(res, 400, 'Dados inválidos. Verifique os campos e tente novamente.');
    }
    return sendError(res, 500, 'Erro interno do servidor');
  }
});

/* GET - Buscar autor por ID */
router.get('/:id', verifyToken, async function(req, res) {
  try {
    const result = await pool.query(
      "SELECT id, nome, pseunonimo FROM autor WHERE id = $1",
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return sendError(res, 404, 'Autor não encontrado');
    }

    return sendSuccess(res, 200, null, result.rows[0]);
  } catch (error) {
    console.error('Erro ao buscar autor:', error);
    return sendError(res, 500, 'Erro interno do servidor');
  }
});

/* PUT - Atualizar autor */
router.put('/:id', verifyToken, isAdmin, async function(req, res) {
  try {
    const { id } = req.params;
    const { nome, pseunonimo } = req.body;

    if (!nome || nome.trim() === '') {
      return sendError(res, 400, 'O nome do autor é obrigatório');
    }

    const result = await pool.query(
      "UPDATE autor SET nome = $1, pseunonimo = $2 WHERE id = $3 RETURNING id, nome, pseunonimo",
      [nome, pseunonimo || null, id]
    );

    if (result.rows.length === 0) {
      return sendError(res, 404, 'Autor não encontrado');
    }

    return sendSuccess(res, 200, 'Autor atualizado com sucesso', result.rows[0]);
  } catch (error) {
    console.error('Erro ao atualizar autor:', error);
    if (error.code === '23514') {
      return sendError(res, 400, 'Dados inválidos. Verifique os campos e tente novamente.');
    }
    return sendError(res, 500, 'Erro interno do servidor');
  }
});

/* DELETE - Remover autor */
router.delete('/:id', verifyToken, isAdmin, async function(req, res) {
  try {
    const { id } = req.params;

    // Verificar se o autor existe
    const autorExists = await pool.query('SELECT id FROM autor WHERE id = $1', [id]);
    if (autorExists.rows.length === 0) {
      return sendError(res, 404, 'Autor não encontrado');
    }

    await pool.query('DELETE FROM autor WHERE id = $1', [id]);

    return sendSuccess(res, 200, 'Autor deletado com sucesso');
  } catch (error) {
    console.error('Erro ao deletar autor:', error);
    return sendError(res, 500, 'Erro interno do servidor');
  }
});

module.exports = router;
