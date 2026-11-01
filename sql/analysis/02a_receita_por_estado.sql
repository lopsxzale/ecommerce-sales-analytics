-- Pergunta 2a: receita, pedidos e ticket médio por estado do cliente.
-- Receita = preço + frete dos itens; exclui pedidos cancelados e indisponíveis.
WITH order_revenue AS (
    SELECT c.customer_state,
           o.order_id,
           SUM(i.price + i.freight_value) AS revenue
    FROM orders o
    JOIN customers c USING (customer_id)
    JOIN order_items i USING (order_id)
    WHERE o.order_status NOT IN ('canceled', 'unavailable')
    GROUP BY c.customer_state, o.order_id
)
SELECT customer_state                                       AS state,
       COUNT(*)                                             AS orders,
       ROUND(SUM(revenue), 2)                               AS revenue,
       ROUND(AVG(revenue), 2)                               AS avg_ticket,
       ROUND(SUM(revenue) / SUM(SUM(revenue)) OVER (), 4)   AS revenue_share,
       RANK() OVER (ORDER BY SUM(revenue) DESC)             AS revenue_rank
FROM order_revenue
GROUP BY customer_state
ORDER BY revenue DESC;
