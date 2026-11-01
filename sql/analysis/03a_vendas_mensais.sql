-- Pergunta 3a: evolução mensal de pedidos e receita, com crescimento mês a mês.
-- Recorte jan/2017 a ago/2018: fora dele o dataset tem cobertura parcial.
WITH monthly AS (
    SELECT DATE_TRUNC('month', o.order_purchase_timestamp)::date AS month,
           COUNT(DISTINCT o.order_id)                             AS orders,
           SUM(i.price + i.freight_value)                         AS revenue
    FROM orders o
    JOIN order_items i USING (order_id)
    WHERE o.order_status NOT IN ('canceled', 'unavailable')
      AND o.order_purchase_timestamp >= '2017-01-01'
      AND o.order_purchase_timestamp <  '2018-09-01'
    GROUP BY 1
)
SELECT TO_CHAR(month, 'YYYY-MM')                                   AS month,
       orders,
       ROUND(revenue, 2)                                           AS revenue,
       ROUND(revenue / orders, 2)                                  AS avg_ticket,
       ROUND(revenue / LAG(revenue) OVER (ORDER BY month) - 1, 4)  AS revenue_mom,
       ROUND(AVG(revenue) OVER (
           ORDER BY month ROWS BETWEEN 2 PRECEDING AND CURRENT ROW
       ), 2)                                                       AS revenue_ma3
FROM monthly
ORDER BY month;
