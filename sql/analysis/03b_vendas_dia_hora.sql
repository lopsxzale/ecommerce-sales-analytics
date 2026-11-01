-- Pergunta 3b: em que dia da semana e hora os clientes mais compram?
-- dow segue ISO: 1 = segunda ... 7 = domingo.
SELECT EXTRACT(ISODOW FROM order_purchase_timestamp)::int AS dow,
       EXTRACT(HOUR FROM order_purchase_timestamp)::int   AS hour,
       COUNT(*)                                           AS orders
FROM orders
WHERE order_status NOT IN ('canceled', 'unavailable')
  AND order_purchase_timestamp >= '2017-01-01'
  AND order_purchase_timestamp <  '2018-09-01'
GROUP BY 1, 2
ORDER BY 1, 2;
