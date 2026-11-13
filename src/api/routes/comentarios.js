
const express = require('express');
const router = express.Router();
const pool = require('../db/config');
const { verifyToken } = require('../middlewares/auth');

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

function isValidId(id) {
    return /^[1-9]\d*$/.test(String(id));
}

// ==========================================
// LISTAR COMENTÁRIOS DE UM LIVRO
// GET /comentarios/livro/:id
// ==========================================

router.get('/livro/:id', verifyToken, async (req, res) => {
    try {
        const { id } = req.params;
        const usuarioId = req.user.id;

        if (!isValidId(id)) {
            return sendError(res, 400, 'ID do livro inválido.');
        }

        const livro = await pool.query(
            'SELECT id FROM livro WHERE id = $1',
            [id]
        );

        if (!livro.rowCount) {
            return sendError(res, 404, 'Livro não encontrado.');
        }

        const result = await pool.query(
            `
            SELECT
                c.id,
                c.livro_id,
                c.usuario_id,
                c.conteudo,
                c.criado_em,
                c.comentario_pai_id,

                -- Dados do usuário diretamente no comentário
                u.login AS login,
                u.foto AS foto,
                -- Biel acrescentou isso
                
                COALESCE(
                    (
                        SELECT jsonb_agg(
                            jsonb_build_object(
                                'login', um.login,
                                'usuario_id', um.id
                            )
                        )
                        FROM mencao_comentario mc
                        INNER JOIN usuario um
                            ON um.id = mc.usuario_mencionado_id
                        WHERE mc.comentario_id = c.id
                    ),
                    '[]'::jsonb
                ) AS mencoes,

                -- Mantém também o objeto usuario
                jsonb_build_object(
                    'id', u.id,
                    'login', u.login,
                    'foto', u.foto
                ) AS usuario,

                (
                    SELECT COUNT(*)
                    FROM reacao_comentario r
                    WHERE r.comentario_id = c.id
                    AND r.tipo = 'like'
                ) AS likes,

                (
                    SELECT COUNT(*)
                    FROM reacao_comentario r
                    WHERE r.comentario_id = c.id
                    AND r.tipo = 'dislike'
                ) AS dislikes,

                (
                    SELECT r.tipo
                    FROM reacao_comentario r
                    WHERE r.comentario_id = c.id
                    AND r.usuario_id = $2
                ) AS minha_reacao

            FROM comentario c

            INNER JOIN usuario u
                ON u.id = c.usuario_id

            WHERE c.livro_id = $1

            ORDER BY c.criado_em DESC
            `,
            [id, usuarioId]
        );

        // Organizar comentários e respostas
        const comentarios = result.rows.map(item => ({
            ...item,
            likes: Number(item.likes),
            dislikes: Number(item.dislikes),
            respostas: []
        }));

        const mapa = new Map();

        comentarios.forEach(comentario => {
            mapa.set(String(comentario.id), comentario);
        });

        const principais = [];

        comentarios.forEach(comentario => {
            if (comentario.comentario_pai_id) {
                const pai = mapa.get(
                    String(comentario.comentario_pai_id)
                );

                if (pai) {
                    pai.respostas.push(comentario);
                }
            } else {
                principais.push(comentario);
            }
        });

        return sendSuccess(
            res,
            200,
            null,
            principais
        );

    } catch (error) {
        console.error('Erro ao listar comentários:', error);

        return sendError(res, 500, 'Erro interno do servidor.');
    }
});

// ==========================================
// PUBLICAR COMENTÁRIO OU RESPOSTA
// POST /comentarios/livro/:id
// ==========================================

router.post('/livro/:id', verifyToken, async (req, res) => {
    let client;
    let transactionStarted = false;

    try {
        const { id } = req.params;
        const usuarioId = req.user.id;

        const {
            conteudo,
            comentario_pai_id
        } = req.body;

        if (!isValidId(id)) {
            return sendError(res, 400, 'ID do livro inválido.');
        }

        if (
            !conteudo ||
            typeof conteudo !== 'string' ||
            !conteudo.trim()
        ) {
            return sendError(res, 400, 'O comentário não pode estar vazio.');
        }

        if (conteudo.trim().length > 2000) {
            return sendError(
                res,
                400,
                'O comentário ultrapassou 2000 caracteres.'
            );
        }

        client = await pool.connect();

        await client.query('BEGIN');
        transactionStarted = true;

        const livro = await client.query(
            'SELECT id FROM livro WHERE id = $1',
            [id]
        );

        if (!livro.rowCount) {
            await client.query('ROLLBACK');
            transactionStarted = false;

            return sendError(res, 404, 'Livro não encontrado.');
        }

        // Verificar se é uma resposta
        if (
            comentario_pai_id !== null &&
            comentario_pai_id !== undefined
        ) {
            if (!isValidId(comentario_pai_id)) {
                await client.query('ROLLBACK');
                transactionStarted = false;

                return sendError(
                    res,
                    400,
                    'Comentário original inválido.'
                );
            }

            const pai = await client.query(
                `
                SELECT id
                FROM comentario
                WHERE id = $1
                AND livro_id = $2
                `,
                [comentario_pai_id, id]
            );

            if (!pai.rowCount) {
                await client.query('ROLLBACK');
                transactionStarted = false;

                return sendError(
                    res,
                    404,
                    'Comentário original não encontrado.'
                );
            }
        }

        const novoComentario = await client.query(
            `
            INSERT INTO comentario (
                livro_id,
                usuario_id,
                comentario_pai_id,
                conteudo
            )
            VALUES ($1, $2, $3, $4)
            RETURNING *
            `,
            [
                id,
                usuarioId,
                comentario_pai_id || null,
                conteudo.trim()
            ]
        );

        const comentario = novoComentario.rows[0];

        // Identificar e salvar menções (@login)
        const logins = [
            ...new Set(
                [...conteudo.matchAll(/@([\p{L}\p{N}_]+(?:[.-][\p{L}\p{N}_]+)*)/gu)]
                    .map(match => match[1].normalize('NFC').toLowerCase())
            )
        ];
        
        for (const login of logins) {
            const usuarioMencionado = await client.query(
                `
                SELECT id
                FROM usuario
                WHERE LOWER(login) = LOWER($1)
                AND id <> $2
                `,
                [login, usuarioId]
            );

            if (usuarioMencionado.rowCount) {
                await client.query(
                    `
                    INSERT INTO mencao_comentario (
                        comentario_id,
                        usuario_mencionado_id
                    )
                    VALUES ($1, $2)
                    ON CONFLICT DO NOTHING
                    `,
                    [
                        comentario.id,
                        usuarioMencionado.rows[0].id
                    ]
                );
            }
        }

        await client.query('COMMIT');
        transactionStarted = false;

        return sendSuccess(
            res,
            201,
            'Comentário publicado com sucesso.',
            comentario
        );

    } catch (error) {
        if (client && transactionStarted) {
            await client.query('ROLLBACK').catch(() => {});
        }

        console.error('Erro ao publicar comentário:', error);

        return sendError(res, 500, 'Erro interno do servidor.');

    } finally {
        if (client) client.release();
    }
});

// ==========================================
// CURTIR OU DESCURTIR
// POST /comentarios/:id/reacao
// ==========================================

router.post('/:id/reacao', verifyToken, async (req, res) => {
    let client;
    let transactionStarted = false;

    try {
        const { id } = req.params;
        const usuarioId = req.user.id;
        const { tipo } = req.body;

        if (!isValidId(id)) {
            return sendError(res, 400, 'ID do comentário inválido.');
        }

        if (!['like', 'dislike'].includes(tipo)) {
            return sendError(res, 400, 'Reação inválida.');
        }

        client = await pool.connect();

        await client.query('BEGIN');
        transactionStarted = true;

        const comentario = await client.query(
            'SELECT id FROM comentario WHERE id = $1',
            [id]
        );

        if (!comentario.rowCount) {
            await client.query('ROLLBACK');
            transactionStarted = false;

            return sendError(res, 404, 'Comentário não encontrado.');
        }

        const reacaoAtual = await client.query(
            `
            SELECT id, tipo
            FROM reacao_comentario
            WHERE comentario_id = $1
            AND usuario_id = $2
            FOR UPDATE
            `,
            [id, usuarioId]
        );

        if (reacaoAtual.rowCount) {
            if (reacaoAtual.rows[0].tipo === tipo) {
                await client.query(
                    'DELETE FROM reacao_comentario WHERE id = $1',
                    [reacaoAtual.rows[0].id]
                );
            } else {
                await client.query(
                    `
                    UPDATE reacao_comentario
                    SET tipo = $1
                    WHERE id = $2
                    `,
                    [tipo, reacaoAtual.rows[0].id]
                );
            }
        } else {
            await client.query(
                `
                INSERT INTO reacao_comentario (
                    comentario_id,
                    usuario_id,
                    tipo
                )
                VALUES ($1, $2, $3)
                `,
                [id, usuarioId, tipo]
            );
        }

        await client.query('COMMIT');
        transactionStarted = false;

        return sendSuccess(
            res,
            200,
            'Reação atualizada com sucesso.'
        );

    } catch (error) {
        if (client && transactionStarted) {
            await client.query('ROLLBACK').catch(() => {});
        }

        console.error('Erro ao reagir:', error);

        return sendError(res, 500, 'Erro interno do servidor.');

    } finally {
        if (client) client.release();
    }
});

// ==========================================
// EXCLUIR COMENTÁRIO PRÓPRIO
// DELETE /comentarios/:id
// ==========================================

router.delete('/:id', verifyToken, async (req, res) => {
    try {
        const { id } = req.params;
        const usuarioId = req.user.id;

        if (!isValidId(id)) {
            return sendError(res, 400, 'ID do comentário inválido.');
        }

        const result = await pool.query(
            `
            DELETE FROM comentario
            WHERE id = $1
            AND usuario_id = $2
            RETURNING id
            `,
            [id, usuarioId]
        );

        if (!result.rowCount) {
            return sendError(
                res,
                404,
                'Comentário não encontrado ou você não tem permissão para excluí-lo.'
            );
        }

        return sendSuccess(
            res,
            200,
            'Comentário excluído com sucesso.'
        );

    } catch (error) {
        console.error('Erro ao excluir comentário:', error);

        return sendError(res, 500, 'Erro interno do servidor.');
    }
});

module.exports = router;
