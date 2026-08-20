import express from "express";
import pool from "../db.js";

const router = express.Router();

router.get(
  "/branches",
  async (req, res) => {
    try {
      const result =
        await pool.query(`
          SELECT DISTINCT
            rb.id,
            COALESCE(
              rb.name->>'mn_MN',
              rb.name->>'en_US',
              rb.name::text
            ) AS name
          FROM public.res_branch rb
          JOIN public.account_move_line aml
            ON aml.branch_id = rb.id
          JOIN public.account_move am
            ON am.id = aml.move_id
          WHERE am.state = 'posted'
          ORDER BY name
        `);

      res.json(
        result.rows.map(
          (row) => ({
            id: Number(row.id),
            name: row.name
          })
        )
      );
    } catch (error) {
      console.error(error);

      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
);

export default router;