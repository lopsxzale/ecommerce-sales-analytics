-- Uma linha por pedido entregue com review (o mais recente), usada no teste estatístico.
WITH latest_review AS (
    SELECT order_id,
           review_score,
           ROW_NUMBER() OVER (
               PARTITION BY order_id ORDER BY review_answer_timestamp DESC
           ) AS rn
    FROM order_reviews
)
SELECT o.order_id,
       r.review_score,
       o.order_delivered_customer_date::date
         - o.order_estimated_delivery_date::date AS delay_days
FROM orders o
JOIN latest_review r ON r.order_id = o.order_id AND r.rn = 1
WHERE o.order_status = 'delivered'
  AND o.order_delivered_customer_date IS NOT NULL;
