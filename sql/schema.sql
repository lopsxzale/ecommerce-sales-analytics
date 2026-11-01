-- Schema relacional do dataset Olist.
-- Idempotente: recria todas as tabelas a cada carga.

DROP TABLE IF EXISTS geolocation, order_reviews, order_payments, order_items,
    orders, products, sellers, customers, category_translation CASCADE;

CREATE TABLE category_translation (
    product_category_name         TEXT PRIMARY KEY,
    product_category_name_english TEXT NOT NULL
);

CREATE TABLE customers (
    customer_id              TEXT PRIMARY KEY,
    customer_unique_id       TEXT NOT NULL,
    customer_zip_code_prefix CHAR(5) NOT NULL,
    customer_city            TEXT NOT NULL,
    customer_state           CHAR(2) NOT NULL
);

CREATE TABLE sellers (
    seller_id              TEXT PRIMARY KEY,
    seller_zip_code_prefix CHAR(5) NOT NULL,
    seller_city            TEXT NOT NULL,
    seller_state           CHAR(2) NOT NULL
);

-- Sem FK para category_translation: duas categorias do dataset não têm tradução
-- (reportado em src/quality.py).
CREATE TABLE products (
    product_id                 TEXT PRIMARY KEY,
    product_category_name      TEXT,
    product_name_length        INT,
    product_description_length INT,
    product_photos_qty         INT,
    product_weight_g           INT,
    product_length_cm          INT,
    product_height_cm          INT,
    product_width_cm           INT
);

CREATE TABLE orders (
    order_id                      TEXT PRIMARY KEY,
    customer_id                   TEXT NOT NULL REFERENCES customers,
    order_status                  TEXT NOT NULL,
    order_purchase_timestamp      TIMESTAMP NOT NULL,
    order_approved_at             TIMESTAMP,
    order_delivered_carrier_date  TIMESTAMP,
    order_delivered_customer_date TIMESTAMP,
    order_estimated_delivery_date TIMESTAMP NOT NULL
);

CREATE TABLE order_items (
    order_id            TEXT NOT NULL REFERENCES orders,
    order_item_id       INT NOT NULL,
    product_id          TEXT NOT NULL REFERENCES products,
    seller_id           TEXT NOT NULL REFERENCES sellers,
    shipping_limit_date TIMESTAMP NOT NULL,
    price               NUMERIC(10, 2) NOT NULL,
    freight_value       NUMERIC(10, 2) NOT NULL,
    PRIMARY KEY (order_id, order_item_id)
);

CREATE TABLE order_payments (
    order_id             TEXT NOT NULL REFERENCES orders,
    payment_sequential   INT NOT NULL,
    payment_type         TEXT NOT NULL,
    payment_installments INT NOT NULL,
    payment_value        NUMERIC(10, 2) NOT NULL,
    PRIMARY KEY (order_id, payment_sequential)
);

-- review_id se repete entre pedidos no dataset original, por isso a PK composta.
CREATE TABLE order_reviews (
    review_id               TEXT NOT NULL,
    order_id                TEXT NOT NULL REFERENCES orders,
    review_score            SMALLINT NOT NULL CHECK (review_score BETWEEN 1 AND 5),
    review_comment_title    TEXT,
    review_comment_message  TEXT,
    review_creation_date    TIMESTAMP NOT NULL,
    review_answer_timestamp TIMESTAMP NOT NULL,
    PRIMARY KEY (review_id, order_id)
);

CREATE TABLE geolocation (
    geolocation_zip_code_prefix CHAR(5) NOT NULL,
    geolocation_lat             DOUBLE PRECISION NOT NULL,
    geolocation_lng             DOUBLE PRECISION NOT NULL,
    geolocation_city            TEXT NOT NULL,
    geolocation_state           CHAR(2) NOT NULL
);

CREATE INDEX idx_customers_unique ON customers (customer_unique_id);
CREATE INDEX idx_customers_state ON customers (customer_state);
CREATE INDEX idx_orders_customer ON orders (customer_id);
CREATE INDEX idx_orders_purchase ON orders (order_purchase_timestamp);
CREATE INDEX idx_order_items_product ON order_items (product_id);
CREATE INDEX idx_order_reviews_order ON order_reviews (order_id);
CREATE INDEX idx_geolocation_zip ON geolocation (geolocation_zip_code_prefix);
