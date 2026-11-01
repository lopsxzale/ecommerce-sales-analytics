-- Pergunta 2b: receita e ticket médio por categoria de produto, com curva de Pareto.
-- avg_ticket = receita da categoria / pedidos que contêm a categoria.
WITH item_revenue AS (
    SELECT COALESCE(p.product_category_name, 'sem_categoria')    AS category_pt,
           COALESCE(t.product_category_name_english,
                    p.product_category_name, 'uncategorized')     AS category_en,
           i.order_id,
           i.price + i.freight_value                              AS revenue
    FROM order_items i
    JOIN orders o USING (order_id)
    JOIN products p USING (product_id)
    LEFT JOIN category_translation t
           ON t.product_category_name = p.product_category_name
    WHERE o.order_status NOT IN ('canceled', 'unavailable')
),
by_category AS (
    SELECT category_pt,
           category_en,
           COUNT(DISTINCT order_id) AS orders,
           COUNT(*)                 AS items,
           SUM(revenue)             AS revenue
    FROM item_revenue
    GROUP BY category_pt, category_en
)
SELECT category_pt,
       category_en,
       orders,
       items,
       ROUND(revenue, 2)                             AS revenue,
       ROUND(revenue / orders, 2)                    AS avg_ticket,
       ROUND(revenue / SUM(revenue) OVER (), 4)      AS revenue_share,
       ROUND(SUM(revenue) OVER (ORDER BY revenue DESC ROWS UNBOUNDED PRECEDING)
             / SUM(revenue) OVER (), 4)              AS cumulative_share
FROM by_category
ORDER BY revenue DESC;
