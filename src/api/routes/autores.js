
const express = require('express');
const router = express.Router();
const pool = require('../db/config');
const upload = require('../middlewares/upload');
const { verifyToken, isAdmin } = require('../middlewares/auth');

function sendSuccess(res, data, message = 'Operação realizada com sucesso.') {
    return res.json({
        success: true,
        message,
        data
    });
}

function sendError(res, status, message, errors = []) {
    return res.status(status).json({
        success: false,
        message,
        errors
    });
}

// LISTAR AUTORES
router.get('/', verifyToken, isAdmin, async (req, res) => {
    try {
        const consulta = req.query.consulta
            ? `%${req.query.consulta.trim()}%`
            : '%';

        const result = await pool.query(
            `SELECT id, nome, pseunonimo, foto, sinopse
             FROM autor
             WHERE nome ILIKE $1
                OR pseunonimo ILIKE $1
             ORDER BY nome`,
            [consulta]
        );

        return sendSuccess(res, result.rows);
    } catch (error) {
        console.error(error);
        return sendError(res, 500, 'Erro ao listar autores.');
    }
});

// CADASTRAR AUTOR
router.post('/', verifyToken, isAdmin, upload.single('foto'), async (req, res) => {
    try {
        const { nome, pseunonimo, sinopse } = req.body;

        if (!nome || !nome.trim()) {
            return sendError(res, 400, 'O nome do autor é obrigatório.', [
                { field: 'nome', message: 'Informe o nome do autor.' }
            ]);
        }

        const foto = req.file ? req.file.filename : null;

        const result = await pool.query(
            `INSERT INTO autor (nome, pseunonimo, foto, sinopse)
             VALUES ($1, $2, $3, $4)
             RETURNING id, nome, pseunonimo, foto, sinopse`,
            [
                nome.trim(),
                pseunonimo || null,
                foto,
                sinopse || null
            ]
        );

        return sendSuccess(res, result.rows[0], 'Autor cadastrado com sucesso.');
    } catch (error) {
        console.error(error);
        return sendError(res, 500, 'Erro ao cadastrar autor.');
    }
});

// BUSCAR AUTOR INDIVIDUAL E SUAS OBRAS
router.get('/:id', verifyToken, async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(
            `SELECT
                a.id,
                a.nome,
                a.pseunonimo,
                a.foto,
                a.sinopse,
                COALESCE(
                    (
                        SELECT json_agg(
                            json_build_object(
                                'id', l.id,
                                'id_autor', l.id_autor,
                                'titulo', l.titulo,
                                'sinopse', l.sinopse,
                                'ano_de_publicacao', l.ano_de_publicacao,
                                'editora', l.editora,
                                'isbn', l.isbn,
                                'foto', l.foto
                            )
                            ORDER BY l.titulo
                        )
                        FROM livro l
                        WHERE l.id_autor = a.id
                    ),
                    '[]'::json
                ) AS obras
             FROM autor a
             WHERE a.id = $1`,
            [id]
        );

        if (result.rows.length === 0) {
            return sendError(res, 404, 'Autor não encontrado.');
        }

        return sendSuccess(res, result.rows[0]);
    } catch (error) {
        console.error(error);
        return sendError(res, 500, 'Erro ao buscar autor.');
    }
});

// EDITAR AUTOR
router.put('/:id', verifyToken, isAdmin, upload.single('foto'), async (req, res) => {
    try {
        const { id } = req.params;
        const { nome, pseunonimo, sinopse } = req.body;

        if (!nome || !nome.trim()) {
            return sendError(res, 400, 'O nome do autor é obrigatório.', [
                { field: 'nome', message: 'Informe o nome do autor.' }
            ]);
        }

        const foto = req.file ? req.file.filename : null;

        const result = await pool.query(
            `UPDATE autor
             SET nome = $1,
                 pseunonimo = $2,
                 sinopse = $3,
                 foto = COALESCE($4, foto)
             WHERE id = $5
             RETURNING id, nome, pseunonimo, foto, sinopse`,
            [
                nome.trim(),
                pseunonimo || null,
                sinopse || null,
                foto,
                id
            ]
        );

        if (result.rows.length === 0) {
            return sendError(res, 404, 'Autor não encontrado.');
        }

        return sendSuccess(res, result.rows[0], 'Autor atualizado com sucesso.');
    } catch (error) {
        console.error(error);
        return sendError(res, 500, 'Erro ao atualizar autor.');
    }
});

// EXCLUIR AUTOR
router.delete('/:id', verifyToken, isAdmin, async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(
            'DELETE FROM autor WHERE id = $1 RETURNING id',
            [id]
        );

        if (result.rows.length === 0) {
            return sendError(res, 404, 'Autor não encontrado.');
        }

        return sendSuccess(res, result.rows[0], 'Autor excluído com sucesso.');
    } catch (error) {
        console.error(error);
        return sendError(res, 500, 'Erro ao excluir autor.');
    }
});

module.exports = router;
