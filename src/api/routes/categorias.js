var express = require('express');
var router = express.Router();
const pool = require('../db/config');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
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

/* GET - Buscar todos as categorias */
// requer usuário autenticado como admin
router.get('/', verifyToken, isAdmin, async function(req, res) {
  try {
    const consulta = req.query.consulta ? '%'+req.query.consulta+'%' : '%';
    const result = await pool.query("SELECT id_categorias, nome FROM categorias WHERE nome LIKE $1 ORDER BY id_categorias", [consulta]);
    return sendSuccess(res, 200, null, result.rows);
  } catch (error) {
    console.error('Erro ao buscar  Categoria:', error);
    return sendError(res, 500, 'Erro interno do servidor');
  }
});

/* POST - Criar nova Categoria */
router.post('/', verifyToken, isAdmin, async function(req, res) {
  try {
    const { nome } = req.body;
    
    console.log(req.body);
    const result = await pool.query(
      "INSERT INTO categorias (nome) VALUES ($1) RETURNING id_categorias, nome",
      [nome]
    );

    return sendSuccess(res, 201, 'Categoria criada com sucesso', result.rows[0]);
  } catch (error) {
    console.error('Erro ao criar categoria:', error);
    // Verificar se é erro de constraint
    if (error.code === '23514') {
      return sendError(res, 400, 'Dados inválidos. Verifique os campos e tente novamente.');
    }
    return sendError(res, 500, 'Erro interno do servidor');
  }
});



/* GET parametrizado - Buscar categoria por nome */
router.get('/:id', verifyToken, async function(req, res) {
  console.log("ENTROUUUUUUUUUUUUUUUUUUUUUUUUUUUU")
  try {
    const { nome } = req.body;
    const result = await pool.query("SELECT id_categorias, nome FROM categorias WHERE id_categorias = $1", [req.params.id]);

    if (result.rows.length === 0) {
      return sendError(res, 404, 'Categoria não encontrado');
    }
    console.log(result.rows[0]);
    return sendSuccess(res, 200, null, result.rows[0]);
  } catch (error) {
    console.error('Erro ao buscar categoria:', error);
    return sendError(res, 500, 'Erro interno do servidor');
  }
});

/* PUT - Atualizar categoria */
router.put('/:id', verifyToken, isAdmin, async function(req, res) {
  console.log('aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa')
  try {
    const { id } = req.params;
    const { nome } = req.body;
    
    let query, params;
    
      query = "UPDATE categorias SET nome = $1 WHERE id_categorias = $2 RETURNING id_categorias, nome";
      params = [nome, id];
    const result = await pool.query(query, params);
    
    return sendSuccess(res, 200, 'Categoria atualizada com sucesso', result.rows[0]);
  } catch (error) {
    console.error('Erro ao atualizar categoria:', error);
    // Verificar se é erro de constraint
    if (error.code === '23514') {
      return sendError(res, 400, 'Dados inválidos. Verifique os campos e tente novamente.');
    }
    return sendError(res, 500, 'Erro interno do servidor');
  }
});

/* DELETE - Remover categoria */
router.delete('/:id', verifyToken, isAdmin, async function(req, res) {
  try {
    const { id } = req.params;
    
    // Verificar se a categoria existe
    const categoriasExists = await pool.query('SELECT id_categorias FROM categorias WHERE id_categorias = $1', [id]);
    if (categoriasExists.rows.length === 0) {
      return sendError(res, 404, 'Categoria não encontrada');
    }
    
    await pool.query('DELETE FROM categorias WHERE id_categorias = $1', [id]);
    
    return sendSuccess(res, 200, 'Categoria deletada com sucesso');
  } catch (error) {
    console.error('Erro ao deletar categoria:', error);
    return sendError(res, 500, 'Erro interno do servidor');
  }
});


module.exports = router;