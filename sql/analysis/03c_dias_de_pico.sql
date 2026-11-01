-- Pergunta 3c: dias com maior volume de pedidos e quanto superam a média diária.
WITH daily AS (
    SELECT order_purchase_timestamp::date AS day,
           COUNT(*)                       AS orders
    FROM orders
    WHERE order_status NOT IN ('canceled', 'unavailable')
      AND order_purchase_timestamp >= '2017-01-01'
      AND order_purchase_timestamp <  '2018-09-01'
    GROUP BY 1
)
SELECT TO_CHAR(day, 'YYYY-MM-DD')              AS day,
       orders,
       ROUND(orders / AVG(orders) OVER (), 2)  AS vs_daily_avg
FROM daily
ORDER BY orders DESC
LIMIT 5;
