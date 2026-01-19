# ART3-HUB Dune Dashboard Queries

Complete set of SQL queries for tracking ART3-HUB platform activity on Base Network.

---

## Table of Contents

1. [NFT Collection Deployments](#1-nft-collection-deployments)
2. [Daily NFT Creation Activity](#2-daily-nft-creation-activity)
3. [Subscription Purchases](#3-subscription-purchases-usdc)
4. [Daily Subscription Revenue](#4-daily-subscription-revenue)
5. [Gallery Collect Payments](#5-gallery-collect-payments-artist-revenue)
6. [Top Artists by Revenue](#6-top-artists-by-gallery-revenue)
7. [Treasury Revenue](#7-treasury-revenue-5-fee)
8. [Gasless Relayer Activity](#8-gasless-relayer-activity)
9. [Comprehensive Overview](#9-comprehensive-overview-dashboard)
10. [All-Time Statistics](#10-all-time-statistics)

---

## Contract Addresses

### Base Mainnet (Chain ID: 8453)

```
Factory V6:              0x8E8f86a2e5BCb6436474833764B3C68cEF89D18D
Subscription V6:         0x2380a7e74480d44f2Fe05B8cA2BDc9d012F56BE8
ClaimableNFT Factory:    0xB253b65b330A51DD452f32617730565d6f6A6b33
Gasless Relayer:         0x825f993Da8912Ae70545F8e6AD47eBCeCe0fdFCd
USDC:                    0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913
```

### Event Signatures

```
CollectionCreated:       0x5fead977881b23a0dbf2f905699203f29cefea57a576d2d4f412523191258e84
```

---

## 1. NFT Collection Deployments

Track all NFT collections created through the Factory contract with decoded names and symbols.

```sql
-- NFT Collections Created via Factory
SELECT
    block_time,
    tx_hash,
    CONCAT('0x', to_hex(bytearray_substring(topic2, 13, 20))) AS collection_address,
    CONCAT('0x', to_hex(bytearray_substring(topic1, 13, 20))) AS artist_wallet,
    from_utf8(bytearray_rtrim(bytearray_substring(data, 65, 64))) AS nft_name,
    from_utf8(bytearray_rtrim(bytearray_substring(data, 129, 64))) AS nft_symbol
FROM base.logs
WHERE contract_address = 0x8E8f86a2e5BCb6436474833764B3C68cEF89D18D
  AND topic0 = 0x5fead977881b23a0dbf2f905699203f29cefea57a576d2d4f412523191258e84
ORDER BY block_time DESC
LIMIT 100
```

**Visualization**: Table
**Key Metrics**: Collection address, artist wallet, NFT name, creation time

---

## 2. Daily NFT Creation Activity

Aggregate daily statistics for NFT collection creation.

```sql
-- Daily NFT Collections Created
SELECT
    DATE_TRUNC('day', block_time) AS day,
    COUNT(*) AS collections_created,
    COUNT(DISTINCT CONCAT('0x', to_hex(bytearray_substring(topic1, 13, 20)))) AS unique_artists
FROM base.logs
WHERE contract_address = 0x8E8f86a2e5BCb6436474833764B3C68cEF89D18D
  AND topic0 = 0x5fead977881b23a0dbf2f905699203f29cefea57a576d2d4f412523191258e84
GROUP BY 1
ORDER BY day DESC
```

**Visualization**: Bar chart or line chart
**Key Metrics**: Daily collections created, unique artists

---

## 3. Subscription Purchases (USDC)

Track all subscription plan purchases (Master $4.99 and Elite $9.99).

```sql
-- Subscription Activity (Master & Elite Plans)
SELECT
    evt_block_time AS block_time,
    evt_tx_hash AS tx_hash,
    "from" AS buyer_wallet,
    value / 1e6 AS usdc_amount,
    CASE
        WHEN value = 4990000 THEN 'Master ($4.99)'
        WHEN value = 9990000 THEN 'Elite ($9.99)'
        ELSE 'Custom'
    END AS plan_type
FROM erc20_base.evt_Transfer
WHERE contract_address = 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913
  AND "to" = 0x2380a7e74480d44f2Fe05B8cA2BDc9d012F56BE8
ORDER BY evt_block_time DESC
```

**Visualization**: Table
**Key Metrics**: Buyer wallet, plan type, USDC amount, timestamp

---

## 4. Daily Subscription Revenue

Breakdown of daily subscription revenue by plan type.

```sql
-- Daily Subscription Revenue by Plan Type
SELECT
    DATE_TRUNC('day', evt_block_time) AS day,
    CASE
        WHEN value = 4990000 THEN 'Master'
        WHEN value = 9990000 THEN 'Elite'
        ELSE 'Custom'
    END AS plan_type,
    COUNT(*) AS purchases,
    SUM(value) / 1e6 AS total_usdc
FROM erc20_base.evt_Transfer
WHERE contract_address = 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913
  AND "to" = 0x2380a7e74480d44f2Fe05B8cA2BDc9d012F56BE8
GROUP BY 1, 2
ORDER BY day DESC, plan_type
```

**Visualization**: Stacked bar chart
**Key Metrics**: Daily revenue by plan, purchase count

---

## 5. Gallery Collect Payments (Artist Revenue)

Track gallery collect transactions showing the 95/5 split between artists and treasury.

```sql
-- Gallery Collect Transactions (95% Artist + 5% Treasury)
SELECT
    evt_block_time AS block_time,
    evt_tx_hash AS tx_hash,
    "from" AS collector,
    "to" AS recipient,
    value / 1e6 AS usdc_amount,
    CASE
        WHEN "to" = 0x825f993Da8912Ae70545F8e6AD47eBCeCe0fdFCd THEN 'Treasury (5%)'
        ELSE 'Artist (95%)'
    END AS recipient_type
FROM erc20_base.evt_Transfer
WHERE contract_address = 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913
  AND (
      "to" = 0x825f993Da8912Ae70545F8e6AD47eBCeCe0fdFCd
      OR "from" IN (
          SELECT DISTINCT "from"
          FROM erc20_base.evt_Transfer
          WHERE contract_address = 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913
            AND "to" = 0x825f993Da8912Ae70545F8e6AD47eBCeCe0fdFCd
      )
  )
ORDER BY evt_block_time DESC
```

**Visualization**: Table
**Key Metrics**: Collector, recipient, amount, split type

---

## 6. Top Artists by Gallery Revenue

Leaderboard of artists earning the most from gallery collects.

```sql
-- Top Earning Artists from Gallery Collects
SELECT
    "to" AS artist_wallet,
    COUNT(*) AS sales_count,
    SUM(value) / 1e6 AS total_earned_usdc
FROM erc20_base.evt_Transfer
WHERE contract_address = 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913
  AND "to" != 0x825f993Da8912Ae70545F8e6AD47eBCeCe0fdFCd
  AND evt_tx_hash IN (
      SELECT evt_tx_hash
      FROM erc20_base.evt_Transfer
      WHERE contract_address = 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913
        AND "to" = 0x825f993Da8912Ae70545F8e6AD47eBCeCe0fdFCd
  )
GROUP BY 1
ORDER BY total_earned_usdc DESC
LIMIT 20
```

**Visualization**: Table or horizontal bar chart
**Key Metrics**: Artist wallet, sales count, total earnings

---

## 7. Treasury Revenue (5% Fee)

Track total treasury revenue from the 5% platform fee on gallery collects.

```sql
-- Total Treasury Revenue from Gallery Collects
SELECT
    DATE_TRUNC('day', evt_block_time) AS day,
    COUNT(*) AS collect_transactions,
    SUM(value) / 1e6 AS treasury_usdc
FROM erc20_base.evt_Transfer
WHERE contract_address = 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913
  AND "to" = 0x825f993Da8912Ae70545F8e6AD47eBCeCe0fdFCd
GROUP BY 1
ORDER BY day DESC
```

**Visualization**: Line chart or area chart
**Key Metrics**: Daily treasury revenue, transaction count

---

## 8. Gasless Relayer Activity

Monitor the gasless relayer wallet activity and gas costs.

```sql
-- Gasless Transactions by Relayer Wallet
SELECT
    DATE_TRUNC('day', block_time) AS day,
    COUNT(*) AS total_txs,
    COUNT(DISTINCT "to") AS unique_contracts,
    SUM(gas_used * gas_price) / 1e18 AS total_eth_spent,
    AVG(gas_used) AS avg_gas_used
FROM base.transactions
WHERE "from" = 0x825f993Da8912Ae70545F8e6AD47eBCeCe0fdFCd
  AND success = true
GROUP BY 1
ORDER BY day DESC
```

**Visualization**: Line chart (dual axis for tx count and ETH spent)
**Key Metrics**: Daily transactions, ETH spent, average gas

---

## 9. Comprehensive Overview Dashboard

All-in-one daily activity overview combining all major metrics.

```sql
-- ART3-HUB Daily Activity Overview
WITH nft_deployments AS (
    SELECT
        DATE_TRUNC('day', block_time) AS day,
        COUNT(*) AS collections_created
    FROM base.logs
    WHERE contract_address = 0x8E8f86a2e5BCb6436474833764B3C68cEF89D18D
      AND topic0 = 0x5fead977881b23a0dbf2f905699203f29cefea57a576d2d4f412523191258e84
    GROUP BY 1
),
subscriptions AS (
    SELECT
        DATE_TRUNC('day', evt_block_time) AS day,
        COUNT(*) AS subscription_purchases,
        SUM(value) / 1e6 AS subscription_revenue
    FROM erc20_base.evt_Transfer
    WHERE contract_address = 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913
      AND "to" = 0x2380a7e74480d44f2Fe05B8cA2BDc9d012F56BE8
    GROUP BY 1
),
gallery_revenue AS (
    SELECT
        DATE_TRUNC('day', evt_block_time) AS day,
        COUNT(*) AS treasury_payments,
        SUM(value) / 1e6 AS treasury_usdc
    FROM erc20_base.evt_Transfer
    WHERE contract_address = 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913
      AND "to" = 0x825f993Da8912Ae70545F8e6AD47eBCeCe0fdFCd
    GROUP BY 1
),
gas_spent AS (
    SELECT
        DATE_TRUNC('day', block_time) AS day,
        SUM(gas_used * gas_price) / 1e18 AS relayer_eth_spent
    FROM base.transactions
    WHERE "from" = 0x825f993Da8912Ae70545F8e6AD47eBCeCe0fdFCd
      AND success = true
    GROUP BY 1
)
SELECT
    COALESCE(n.day, s.day, g.day, gs.day) AS date,
    COALESCE(n.collections_created, 0) AS nft_collections,
    COALESCE(s.subscription_purchases, 0) AS subscriptions,
    COALESCE(s.subscription_revenue, 0) AS subscription_revenue_usdc,
    COALESCE(g.treasury_payments, 0) AS gallery_collects,
    COALESCE(g.treasury_usdc, 0) AS gallery_revenue_usdc,
    COALESCE(gs.relayer_eth_spent, 0) AS gasless_eth_spent,
    COALESCE(s.subscription_revenue, 0) + COALESCE(g.treasury_usdc, 0) AS total_revenue_usdc
FROM nft_deployments n
FULL OUTER JOIN subscriptions s ON n.day = s.day
FULL OUTER JOIN gallery_revenue g ON n.day = g.day
FULL OUTER JOIN gas_spent gs ON n.day = gs.day
ORDER BY date DESC
```

**Visualization**: Multi-line chart or table
**Key Metrics**: All platform metrics combined

---

## 10. All-Time Statistics

Summary statistics showing cumulative platform metrics.

```sql
-- ART3-HUB All-Time Stats
SELECT
    'Total NFT Collections' AS metric,
    COUNT(*) AS value
FROM base.logs
WHERE contract_address = 0x8E8f86a2e5BCb6436474833764B3C68cEF89D18D
  AND topic0 = 0x5fead977881b23a0dbf2f905699203f29cefea57a576d2d4f412523191258e84

UNION ALL

SELECT
    'Total Subscription Revenue (USDC)' AS metric,
    SUM(value) / 1e6 AS value
FROM erc20_base.evt_Transfer
WHERE contract_address = 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913
  AND "to" = 0x2380a7e74480d44f2Fe05B8cA2BDc9d012F56BE8

UNION ALL

SELECT
    'Total Treasury Revenue (USDC)' AS metric,
    SUM(value) / 1e6 AS value
FROM erc20_base.evt_Transfer
WHERE contract_address = 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913
  AND "to" = 0x825f993Da8912Ae70545F8e6AD47eBCeCe0fdFCd

UNION ALL

SELECT
    'Total Gasless ETH Spent' AS metric,
    SUM(gas_used * gas_price) / 1e18 AS value
FROM base.transactions
WHERE "from" = 0x825f993Da8912Ae70545F8e6AD47eBCeCe0fdFCd
  AND success = true
```

**Visualization**: Stats cards / counter widgets
**Key Metrics**: Cumulative totals for all major metrics

---

## Dashboard Layout Recommendations

### Section 1: Key Performance Indicators (Top Row)
- Query #10 → Stats cards (4 metrics)

### Section 2: Daily Activity Trends (Middle)
- Query #9 → Multi-line chart (daily overview)
- Query #2 → Bar chart (NFT creation)
- Query #4 → Stacked bar (subscription revenue)

### Section 3: Revenue Breakdown (Bottom Left)
- Query #7 → Area chart (treasury revenue)
- Query #8 → Dual-axis line chart (gasless activity)

### Section 4: Leaderboards (Bottom Right)
- Query #6 → Table (top artists)
- Query #3 → Recent subscriptions table

---

## Notes

- All queries use Dune's Trino/Presto SQL syntax
- USDC amounts are divided by `1e6` (6 decimals)
- ETH amounts are divided by `1e18` (18 decimals)
- Gas prices are divided by `1e9` for Gwei conversion
- All timestamps are in UTC

---

## Troubleshooting

### If NFT names show as hex:
The `from_utf8()` and `bytearray_rtrim()` functions should decode properly. If issues persist, you may need to submit your contract ABI to Dune for automatic decoding.

### To submit contract for decoding:
1. Go to: https://dune.com/contracts/new
2. Select "Base" network
3. Enter contract address: `0x8E8f86a2e5BCb6436474833764B3C68cEF89D18D`
4. Upload ABI from BaseScan
5. Wait for Dune to create decoded event tables

---

**Last Updated**: January 2025
**Network**: Base Mainnet (Chain ID 8453)
**Platform**: https://art3-hub.vercel.app
