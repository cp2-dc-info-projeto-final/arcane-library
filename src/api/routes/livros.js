var express = require('express');
var router = express.Router();
const pool = require('../db/config');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const upload = require('../middlewares/upload');
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

/* GET - Buscar todos os livros */
// requer usuário autenticado como admin
router.get('/', verifyToken, isAdmin, async function(req, res) {
  try {
    const consulta = req.query.consulta ? '%'+req.query.consulta+'%' : '%';
    const result = await pool.query("SELECT id, id_categorias, titulo, ano_de_publicacao, editora, isbn foto FROM livro WHERE titulo LIKE $1 ORDER BY id", [consulta]);
    return sendSuccess(res, 200, null, result.rows);
  } catch (error) {
    console.error('Erro ao buscar  Livro:', error);
    return sendError(res, 500, 'Erro interno do servidor');
  }
});

/* POST - Publicar novo livro */
router.post('/', verifyToken, isAdmin, upload.single('foto'), async function(req, res) {
  try {
    const { id_categorias, titulo, ano_de_publicacao, editora, isbn } = req.body;
    
    console.log(req.body);

 
    const result = await pool.query(
  "INSERT INTO livro (id_categorias, titulo, ano_de_publicacao, editora, isbn, foto) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, id_categorias, titulo, ano_de_publicacao, editora, isbn, foto",
  [id_categorias, titulo, ano_de_publicacao, editora, isbn, req.file?.filename || null]
    );

    return sendSuccess(res, 201, 'Livro publicado com sucesso', result.rows[0]);
  } catch (error) {
    console.error('Erro ao publicar livro:', error);
    // Verificar se é erro de constraint
    if (error.code === '23514') {
      return sendError(res, 400, 'Dados inválidos. Verifique os campos e tente novamente.');
    }
    return sendError(res, 500, 'Erro interno do servidor');
  }
});



/* GET parametrizado - Buscar livro por nome */
router.get('/:id', verifyToken, async function(req, res) {
  console.log("ENTROUUUUUUUUUUUUUUUUUUUUUUUUUUUU")
  try {
    const { titulo } = req.body;
    const result = await pool.query("SELECT id, id_categorias, titulo, ano_de_publicacao, editora, isbn, foto FROM livro WHERE id = $1", [req.params.id]);

    if (result.rows.length === 0) {
      return sendError(res, 404, 'Livro não encontrado');
    }
    console.log(result.rows[0]);
    return sendSuccess(res, 200, null, result.rows[0]);
  } catch (error) {
    console.error('Erro ao buscar livro:', error);
    return sendError(res, 500, 'Erro interno do servidor');
  }
});



/* PUT - Atualizar livro */
router.put('/:id', verifyToken, isAdmin, upload.single('foto'), async function(req, res) {
  try {
    const { id } = req.params;
    const { id_categorias, titulo, ano_de_publicacao, editora, isbn } = req.body;

    // Verificar se livro existe
    const livroExists = await pool.query('SELECT foto FROM livro WHERE id = $1', [id]);
    if (livroExists.rows.length === 0) {
      return sendError(res, 404, 'Livro não encontrado');
    }

    // Se enviou foto nova, usa ela. Se não, mantém a antiga
    const fotoAtual = livroExists.rows[0].foto;
    const fotoPath = req.file ? req.file.filename : fotoAtual;

    const result = await pool.query(
     "INSERT INTO livro (id_categorias, titulo, ano_de_publicacao, editora, isbn, foto) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, id_categorias, titulo, ano_de_publicacao, editora, isbn, foto",
      [id_categorias, titulo, ano_de_publicacao, editora, isbn, req.file?.filename || null]
    );

    return sendSuccess(res, 200, 'Livro atualizado com sucesso', result.rows[0]);
  } catch (error) {
    console.error('Erro ao atualizar livro:', error);
    if (error.code === '23505') {
      return sendError(res, 400, 'ISBN já existe no sistema');
    }
    return sendError(res, 500, 'Erro interno do servidor');
  }
});


/* DELETE - Remover livro */
router.delete('/:id', verifyToken, isAdmin, async function(req, res) {
  try {
    const { id } = req.params;
    
    // Verificar se a categoria existe
    const livroExists = await pool.query('SELECT id FROM livro WHERE id = $1', [id]);
    if (livroExists.rows.length === 0) {
      return sendError(res, 404, 'Livro não encontrada');
    }
    
    await pool.query('DELETE FROM livro WHERE id = $1', [id]);
    
    return sendSuccess(res, 200, 'Livro deletado com sucesso');
  } catch (error) {
    console.error('Erro ao deletar livro:', error);
    return sendError(res, 500, 'Erro interno do servidor');
  }
});


module.exports = router;