var express = require('express');
var router = express.Router();

const pool = require('../db/config');
const upload = require('../middlewares/upload');
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

/*
 * GET /
 * Buscar todos os livros com filtro por busca e categorias
 */
router.get('/', verifyToken, isAdmin, async function (req, res) {
  try {
    const consulta = req.query.consulta ? `%${req.query.consulta}%` : '%';
    let categoriasIds = [];

    if (req.query.categorias) {
      categoriasIds = String(req.query.categorias)
        .split(',')
        .map(Number)
        .filter((id) => Number.isInteger(id) && id > 0);
    }

    let queryText = `
      SELECT
        l.id,
        l.id_autor,
        l.titulo,
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
      WHERE (
        l.titulo ILIKE $1
        OR a.nome ILIKE $1
        OR a.pseunonimo ILIKE $1
      )
    `;

    const queryParams = [consulta];

    if (categoriasIds.length > 0) {
      queryText += ` AND lc.id_categorias = ANY($2::bigint[])`;
      queryParams.push(categoriasIds);
    }

    queryText += `
      GROUP BY
        l.id,
        l.id_autor,
        l.titulo,
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

/*
 * POST /
 * Cadastrar novo livro
 */
router.post(
  '/',
  verifyToken,
  isAdmin,
  upload.single('foto'),
  async function (req, res) {
    const client = await pool.connect();

    try {
      const id_autor = req.body.id_autor || req.body.autor;
      const rawCategorias = req.body.id_categorias || req.body.categorias;
      const { titulo, ano_de_publicacao, editora, isbn } = req.body;

      if (!id_autor) {
        return sendError(res, 400, 'ID do autor é obrigatório.');
      }

      let categoriasIds = [];

      if (rawCategorias) {
        try {
          categoriasIds =
            typeof rawCategorias === 'string'
              ? JSON.parse(rawCategorias)
              : rawCategorias;

          if (!Array.isArray(categoriasIds)) {
            return sendError(
              res,
              400,
              'Categorias devem ser enviadas como uma lista.'
            );
          }

          categoriasIds = categoriasIds
            .map(Number)
            .filter((id) => Number.isInteger(id) && id > 0);
        } catch (error) {
          return sendError(res, 400, 'Formato de categorias inválido.');
        }
      }

      const autorExists = await client.query(
        `SELECT id FROM autor WHERE id = $1`,
        [id_autor]
      );

      if (autorExists.rows.length === 0) {
        return sendError(res, 400, 'Autor não encontrado.');
      }

      if (categoriasIds.length > 0) {
        const categoriasExists = await client.query(
          `
          SELECT id_categorias
          FROM categorias
          WHERE id_categorias = ANY($1::bigint[])
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

      await client.query('BEGIN');

      const livroResult = await client.query(
        `
        INSERT INTO livro (
          titulo,
          ano_de_publicacao,
          id_autor,
          editora,
          isbn,
          foto
        )
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id, id_autor, titulo, ano_de_publicacao, editora, isbn, foto
        `,
        [
          titulo,
          ano_de_publicacao,
          id_autor,
          editora,
          isbn,
          req.file?.filename || null
        ]
      );

      const livro = livroResult.rows[0];

      for (const categoriaId of categoriasIds) 
      {
        await client.query(
          `
          INSERT INTO livro_categoria (id_livro, id_categorias)
          VALUES ($1, $2)
          `,
          [livro.id, categoriaId]
        );
      }

      await client.query('COMMIT');

      const livroCompleto = await pool.query (
        `
        SELECT
          l.id,
          l.id_autor,
          l.titulo,
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
        WHERE l.id = $1

        GROUP BY
          l.id,
          l.id_autor,
          l.titulo,
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
    }catch (error) {
      await client.query('ROLLBACK');
      console.error('Erro ao publicar livro:', error);

      if (error.code === '23505') {
        return sendError(res, 400, 'ISBN já existe no sistema.');
      }

      return sendError(res, 500, 'Erro interno do servidor');
    } finally {
      client.release();
    }
  }
);


/*

 * GET /:id
 * Buscar um livro específico por ID
 */
router.get('/:id', verifyToken, isAdmin, async function (req, res) {
  try 
  {
    const { id } = req.params;

    const result = await pool.query(
      `
      SELECT
        l.id,
        l.id_autor,
        l.titulo,
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
      WHERE l.id = $1

      GROUP BY
        l.id,
        l.id_autor,
        l.titulo,
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
      return sendError(res, 404, 'Livro não encontrado');
    }

    return sendSuccess(res, 200, null, result.rows[0]);
  } catch (error) {
    console.error('Erro ao buscar livro:', error);
    return sendError(res, 500, 'Erro interno do servidor');
  }
});


/*

 * PUT /:id

 * Atualizar livro
 */
router.put(
  '/:id',
  verifyToken,
  isAdmin,
  upload.single('foto'),
  async function (req, res) {

    const client = await pool.connect();

    try {

      const { id } = req.params;
      const id_autor = req.body.id_autor || req.body.autor;
      const rawCategorias = req.body.id_categorias || req.body.categorias;
      const { titulo, ano_de_publicacao, editora, isbn } = req.body;

      let categoriasIds = [] ;

      if (rawCategorias) {
        try {
          categoriasIds =
            typeof rawCategorias === 'string'
              ? JSON.parse(rawCategorias)
              : rawCategorias;

          if (!Array.isArray(categoriasIds)) {
            return sendError(
              res,
              400,
              'Categorias devem ser enviadas como uma lista.'
            );
          }

          categoriasIds = categoriasIds
            .map(Number)
            .filter((id) => Number.isInteger(id) && id > 0);
        } catch (error) {
          return sendError(res, 400, 'Formato de categorias inválido.');
        }
      }

      const livroExists = await client.query (
        `SELECT id, foto FROM livro WHERE id = $1`,
        [id]
      );

      if (livroExists.rows.length === 0) {
        return sendError(res, 404, 'Livro não encontrado');
      }

      const autorExists = await client.query (
        `SELECT id FROM autor WHERE id = $1`,
        [id_autor]
      );

      if (autorExists.rows.length === 0) {
        return sendError(res, 400, 'Autor não encontrado.');
      }

      if (categoriasIds.length === 0)
       {
        return sendError(
          res,
          400,
          'O livro deve possuir pelo menos uma categoria.'
        );

      }

      const categoriasExists = await client.query (
        `
        SELECT id_categorias
        FROM categorias
        WHERE id_categorias = ANY($1::bigint[])
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


      const fotoAtual = livroExists.rows[0].foto;
      const fotoPath = req.file ? req.file.filename : fotoAtual;

      await client.query('BEGIN');


      await client.query(
        `
        UPDATE livro

        SET
          id_autor = $1,
          titulo = $2,
          ano_de_publicacao = $3,
          editora = $4,
          isbn = $5,
          foto = $6

        WHERE id = $7
        `,
        [id_autor, titulo, ano_de_publicacao, editora, isbn, fotoPath, id]
      );


      await client.query(
        `DELETE FROM livro_categoria WHERE id_livro = $1`,
        [id]
      );

      for (const categoriaId of categoriasIds) {

        await client.query(
          `
          INSERT INTO livro_categoria (id_livro, id_categorias)
          VALUES ($1, $2)
          `,
          [id, categoriaId]
        );
      }

      await client.query('COMMIT');


      const livroAtualizado = await pool.query(
        `
        SELECT
          l.id,
          l.id_autor,
          l.titulo,
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
        WHERE l.id = $1

        GROUP BY
          l.id,
          l.id_autor,
          l.titulo,
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
    }catch (error) {
      await client.query('ROLLBACK');
      console.error('Erro ao atualizar livro:', error);

      if (error.code === '23505') {
        return sendError(res, 400, 'ISBN já existe no sistema.');
      }

      return sendError(res, 500, 'Erro interno do servidor');
    } finally {
      client.release();
    }
  }
);


/*
 * DELETE /:id

 * Remover livro
 */
router.delete('/:id', verifyToken, isAdmin, async function (req, res) {
  try {
    const { id } = req.params;

    const livroExists = await pool.query(
      `SELECT id FROM livro WHERE id = $1`,
      [id]
    );

    if (livroExists.rows.length === 0) {
      return sendError(res, 404, 'Livro não encontrado');
    }

    await pool.query(`DELETE FROM livro WHERE id = $1`, [id]);

    return sendSuccess(res, 200, 'Livro deletado com sucesso');
  } catch (error) {
    console.error('Erro ao deletar livro:', error);
    return sendError(res, 500, 'Erro interno do servidor');
  }
});

module.exports = router;