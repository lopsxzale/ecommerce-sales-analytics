-- KPIs gerais do período. "Pedidos válidos" exclui cancelados e indisponíveis.
WITH valid_orders AS (
    SELECT order_id, customer_id, order_purchase_timestamp
    FROM orders
    WHERE order_status NOT IN ('canceled', 'unavailable')
),
order_revenue AS (
    SELECT v.order_id, SUM(i.price + i.freight_value) AS revenue
    FROM valid_orders v
    JOIN order_items i USING (order_id)
    GROUP BY v.order_id
),
delivered AS (
    SELECT (order_delivered_customer_date::date > order_estimated_delivery_date::date) AS is_late
    FROM orders
    WHERE order_status = 'delivered'
      AND order_delivered_customer_date IS NOT NULL
)
SELECT
    (SELECT COUNT(*) FROM order_revenue)                                AS orders,
    (SELECT ROUND(SUM(revenue), 2) FROM order_revenue)                  AS revenue,
    (SELECT ROUND(AVG(revenue), 2) FROM order_revenue)                  AS avg_ticket,
    (SELECT COUNT(DISTINCT c.customer_unique_id)
       FROM valid_orders v JOIN customers c USING (customer_id))        AS customers,
    (SELECT COUNT(DISTINCT seller_id) FROM order_items)                 AS sellers,
    (SELECT COUNT(*) FROM products)                                     AS products,
    (SELECT ROUND(AVG(review_score), 3) FROM order_reviews)             AS avg_score,
    (SELECT ROUND(AVG(is_late::int), 4) FROM delivered)                 AS late_rate,
    (SELECT TO_CHAR(MIN(order_purchase_timestamp), 'YYYY-MM-DD') FROM valid_orders) AS period_start,
    (SELECT TO_CHAR(MAX(order_purchase_timestamp), 'YYYY-MM-DD') FROM valid_orders) AS period_end;
