
const express = require('express');
const router = express.Router();

const pool = require('../db/config');
const upload = require('../middlewares/upload');
const { verifyToken, isAdmin } = require('../middlewares/auth');

// ==========================================
// RESPOSTAS PADRONIZADAS
// ==========================================

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

// ==========================================
// VALIDAÇÕES AUXILIARES
// ==========================================

function isValidId(id) {
  return /^[1-9]\d*$/.test(String(id));
}

function parseCategorias(rawCategorias) {
  if (!rawCategorias) return [];

  const categorias = typeof rawCategorias === 'string'
    ? JSON.parse(rawCategorias)
    : rawCategorias;

  if (!Array.isArray(categorias)) {
    throw new Error('Categorias devem ser enviadas como uma lista.');
  }

  return categorias.map(String).filter(isValidId);
}

// ==========================================
// CONSULTA COMPLETA DO LIVRO
// ==========================================

const livroSelect = `
  SELECT
    l.id,
    l.id_autor,
    l.titulo,
    l.sinopse,
    l.ano_de_publicacao,
    l.editora,
    l.isbn,
    l.foto,
    a.nome AS autor,
    a.pseunonimo,

    COALESCE(
      json_agg(
        DISTINCT jsonb_build_object(
          'id_categorias', c.id_categorias,
          'nome', c.nome
        )
      ) FILTER (WHERE c.id_categorias IS NOT NULL),
      '[]'
    ) AS categorias

  FROM livro l

  INNER JOIN autor a ON a.id = l.id_autor
  LEFT JOIN livro_categoria lc ON lc.id_livro = l.id
  LEFT JOIN categorias c ON c.id_categorias = lc.id_categorias
`;

// ==========================================
// GET /
// Buscar todos os livros
// ==========================================

router.get('/', verifyToken, async function (req, res) {
  try {
    const consulta = req.query.consulta
      ? `%${req.query.consulta}%`
      : '%';

    let categoriasIds = [];

    if (req.query.categorias) {
      categoriasIds = String(req.query.categorias)
        .split(',')
        .filter(isValidId);
    }

    let queryText = `
      ${livroSelect}

      WHERE (
        l.titulo ILIKE $1
        OR l.sinopse ILIKE $1
        OR a.nome ILIKE $1
        OR a.pseunonimo ILIKE $1
      )
    `;

    const queryParams = [consulta];

    if (categoriasIds.length > 0) {
      queryText += `
        AND lc.id_categorias = ANY($2::BIGINT[])
      `;

      queryParams.push(categoriasIds);
    }

    queryText += `
      GROUP BY
        l.id,
        l.id_autor,
        l.titulo,
        l.sinopse,
        l.ano_de_publicacao,
        l.editora,
        l.isbn,
        l.foto,
        a.nome,
        a.pseunonimo

      ORDER BY l.id
    `;

    const result = await pool.query(queryText, queryParams);

    return sendSuccess(res, 200, null, result.rows);

  } catch (error) {
    console.error('Erro ao buscar livros:', error);

    return sendError(res, 500, 'Erro interno do servidor');
  }
});

// ==========================================
// POST /
// Cadastrar novo livro
// ==========================================

router.post(
  '/',
  verifyToken,
  isAdmin,
  upload.single('foto'),
  async function (req, res) {

    const client = await pool.connect();
    let transactionStarted = false;

    try {
      const id_autor = req.body.id_autor || req.body.autor;
      const rawCategorias = req.body.id_categorias || req.body.categorias;

      const {
        titulo,
        sinopse,
        ano_de_publicacao,
        editora,
        isbn
      } = req.body;

      // Validar dados obrigatórios

      if (!titulo || !id_autor) {
        return sendError(res, 400, 'Título e autor são obrigatórios.');
      }

      if (!isValidId(id_autor)) {
        return sendError(res, 400, 'ID do autor inválido.');
      }

      // Processar categorias

      let categoriasIds;

      try {
        categoriasIds = parseCategorias(rawCategorias);
      } catch (error) {
        return sendError(res, 400, error.message);
      }

      // Verificar autor

      const autorExists = await client.query(
        `
        SELECT id
        FROM autor
        WHERE id = $1::BIGINT
        `,
        [id_autor]
      );

      if (autorExists.rows.length === 0) {
        return sendError(res, 400, 'Autor não encontrado.');
      }

      // Verificar categorias

      if (categoriasIds.length > 0) {
        const categoriasExists = await client.query(
          `
          SELECT id_categorias
          FROM categorias
          WHERE id_categorias = ANY($1::BIGINT[])
          `,
          [categoriasIds]
        );

        if (categoriasExists.rows.length !== categoriasIds.length) {
          return sendError(
            res,
            400,
            'Uma ou mais categorias não foram encontradas.'
          );
        }
      }

      // Iniciar transação

      await client.query('BEGIN');
      transactionStarted = true;

      // Nome da imagem enviada pelo Multer

      const foto = req.file ? req.file.filename : null;

      // Inserir livro

      const livroResult = await client.query(
        `
        INSERT INTO livro (
          titulo,
          sinopse,
          ano_de_publicacao,
          id_autor,
          editora,
          isbn,
          foto
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7)

        RETURNING
          id,
          id_autor,
          titulo,
          sinopse,
          ano_de_publicacao,
          editora,
          isbn,
          foto
        `,
        [
          titulo,
          sinopse,
          ano_de_publicacao,
          id_autor,
          editora,
          isbn,
          foto
        ]
      );

      const livro = livroResult.rows[0];

      // Associar categorias

      for (const categoriaId of categoriasIds) {
        await client.query(
          `
          INSERT INTO livro_categoria (
            id_livro,
            id_categorias
          )
          VALUES ($1, $2)
          `,
          [livro.id, categoriaId]
        );
      }

      await client.query('COMMIT');
      transactionStarted = false;

      // Buscar livro completo

      const livroCompleto = await pool.query(
        `
        ${livroSelect}

        WHERE l.id = $1::BIGINT

        GROUP BY
          l.id,
          l.id_autor,
          l.titulo,
          l.sinopse,
          l.ano_de_publicacao,
          l.editora,
          l.isbn,
          l.foto,
          a.nome,
          a.pseunonimo
        `,
        [livro.id]
      );

      return sendSuccess(
        res,
        201,
        'Livro publicado com sucesso',
        livroCompleto.rows[0]
      );

    } catch (error) {
      if (transactionStarted) {
        await client.query('ROLLBACK');
      }

      console.error('Erro ao publicar livro:', error);

      if (error.code === '23505') {
        return sendError(res, 409, 'ISBN já existe no sistema.');
      }

      if (error.code === '23503') {
        return sendError(res, 400, 'Autor ou categoria inválida.');
      }

      if (error.code === '23514') {
        return sendError(res, 400, 'Dados inválidos.');
      }

      return sendError(res, 500, 'Erro interno do servidor');

    } finally {
      client.release();
    }
  }
);

// ==========================================
// GET /:id
// Buscar livro por ID
// ==========================================

router.get('/:id', verifyToken, async function (req, res) {
  try {
    const { id } = req.params;

    if (!isValidId(id)) {
      return sendError(res, 400, 'ID do livro inválido.');
    }

    const result = await pool.query(
      `
      ${livroSelect}

      WHERE l.id = $1::BIGINT

      GROUP BY
        l.id,
        l.id_autor,
        l.titulo,
        l.sinopse,
        l.ano_de_publicacao,
        l.editora,
        l.isbn,
        l.foto,
        a.nome,
        a.pseunonimo
      `,
      [id]
    );

    if (result.rows.length === 0) {
      return sendError(res, 404, 'Livro não encontrado.');
    }

    return sendSuccess(res, 200, null, result.rows[0]);

  } catch (error) {
    console.error('Erro ao buscar livro:', error);

    return sendError(res, 500, 'Erro interno do servidor');
  }
});

// ==========================================
// PUT /:id
// Atualizar livro
// ==========================================

router.put(
  '/:id',
  verifyToken,
  isAdmin,
  upload.single('foto'),
  async function (req, res) {

    const client = await pool.connect();
    let transactionStarted = false;

    try {
      const { id } = req.params;

      const id_autor = req.body.id_autor || req.body.autor;
      const rawCategorias = req.body.id_categorias || req.body.categorias;

      const {
        titulo,
        sinopse,
        ano_de_publicacao,
        editora,
        isbn
      } = req.body;

      // Validar IDs

      if (!isValidId(id)) {
        return sendError(res, 400, 'ID do livro inválido.');
      }

      if (!isValidId(id_autor)) {
        return sendError(res, 400, 'ID do autor inválido.');
      }

      if (!titulo) {
        return sendError(res, 400, 'Título é obrigatório.');
      }

      // Processar categorias

      let categoriasIds;

      try {
        categoriasIds = parseCategorias(rawCategorias);
      } catch (error) {
        return sendError(res, 400, error.message);
      }

      if (categoriasIds.length === 0) {
        return sendError(
          res,
          400,
          'O livro deve possuir pelo menos uma categoria.'
        );
      }

      // Verificar livro e recuperar foto atual

      const livroExists = await client.query(
        `
        SELECT id, foto
        FROM livro
        WHERE id = $1::BIGINT
        `,
        [id]
      );

      if (livroExists.rows.length === 0) {
        return sendError(res, 404, 'Livro não encontrado.');
      }

      // Verificar autor

      const autorExists = await client.query(
        `
        SELECT id
        FROM autor
        WHERE id = $1::BIGINT
        `,
        [id_autor]
      );

      if (autorExists.rows.length === 0) {
        return sendError(res, 400, 'Autor não encontrado.');
      }

      // Verificar categorias

      const categoriasExists = await client.query(
        `
        SELECT id_categorias
        FROM categorias
        WHERE id_categorias = ANY($1::BIGINT[])
        `,
        [categoriasIds]
      );

      if (categoriasExists.rows.length !== categoriasIds.length) {
        return sendError(
          res,
          400,
          'Uma ou mais categorias não foram encontradas.'
        );
      }

      // Preservar foto antiga se não houver novo upload

      const fotoAtual = livroExists.rows[0].foto;

      const foto = req.file
        ? req.file.filename
        : fotoAtual;

      // Iniciar transação

      await client.query('BEGIN');
      transactionStarted = true;

      // Atualizar livro

      await client.query(
        `
        UPDATE livro

        SET
          id_autor = $1,
          titulo = $2,
          sinopse = $3,
          ano_de_publicacao = $4,
          editora = $5,
          isbn = $6,
          foto = $7

        WHERE id = $8::BIGINT
        `,
        [
          id_autor,
          titulo,
          sinopse,
          ano_de_publicacao,
          editora,
          isbn,
          foto,
          id
        ]
      );

      // Remover associações antigas

      await client.query(
        `
        DELETE FROM livro_categoria
        WHERE id_livro = $1::BIGINT
        `,
        [id]
      );

      // Inserir novas associações

      for (const categoriaId of categoriasIds) {
        await client.query(
          `
          INSERT INTO livro_categoria (
            id_livro,
            id_categorias
          )
          VALUES ($1, $2)
          `,
          [id, categoriaId]
        );
      }

      await client.query('COMMIT');
      transactionStarted = false;

      // Buscar livro atualizado

      const livroAtualizado = await pool.query(
        `
        ${livroSelect}

        WHERE l.id = $1::BIGINT

        GROUP BY
          l.id,
          l.id_autor,
          l.titulo,
          l.sinopse,
          l.ano_de_publicacao,
          l.editora,
          l.isbn,
          l.foto,
          a.nome,
          a.pseunonimo
        `,
        [id]
      );

      return sendSuccess(
        res,
        200,
        'Livro atualizado com sucesso',
        livroAtualizado.rows[0]
      );

    } catch (error) {
      if (transactionStarted) {
        await client.query('ROLLBACK');
      }

      console.error('Erro ao atualizar livro:', error);

      if (error.code === '23505') {
        return sendError(res, 409, 'ISBN já existe no sistema.');
      }

      if (error.code === '23503') {
        return sendError(res, 400, 'Autor ou categoria inválida.');
      }

      if (error.code === '23514') {
        return sendError(res, 400, 'Dados inválidos.');
      }

      return sendError(res, 500, 'Erro interno do servidor');

    } finally {
      client.release();
    }
  }
);

// ==========================================
// DELETE /:id
// Remover livro
// ==========================================

router.delete('/:id', verifyToken, isAdmin, async function (req, res) {
  try {
    const { id } = req.params;

    if (!isValidId(id)) {
      return sendError(res, 400, 'ID do livro inválido.');
    }

    const livroExists = await pool.query(
      `
      SELECT id
      FROM livro
      WHERE id = $1::BIGINT
      `,
      [id]
    );

    if (livroExists.rows.length === 0) {
      return sendError(res, 404, 'Livro não encontrado.');
    }

    await pool.query(
      `
      DELETE FROM livro
      WHERE id = $1::BIGINT
      `,
      [id]
    );

    return sendSuccess(res, 200, 'Livro deletado com sucesso');

  } catch (error) {
    console.error('Erro ao deletar livro:', error);

    return sendError(res, 500, 'Erro interno do servidor');
  }
});

module.exports = router;
