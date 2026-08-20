# COVERAGE — mock data (30 assets + 125 rules)

> Sinh tat dinh tu gen.py + tools/generate-coverage.js, anchor 2026-08-18T09:00:00+07:00. Moi con so duoi day la 1 assertion phai dung.

## Assets (tab Overview / Health)

- **healthStatus**: `Critical`=6, `Warning`=9, `Healthy`=12, `Unknown`=3
- **domain**: `Sales`=6, `Finance`=4, `Operations`=8, `Marketing`=5, `Compliance`=4, `Risk`=3
- **service**: `mysql_prod`=6, `postgres_dwh`=6, `snowflake_analytics`=6, `bigquery_mart`=6, `s3_datalake`=6
- **owner**: `Data Platform`=6, `Marketing Ops`=6, `Analytics`=6, `Finance Ops`=6, `Content`=6
- **tier**: `Tier1`=10, `Tier2`=10, `Tier3`=10
- **failing healthDimension**: `Accuracy`=4, `Completeness`=4, `Consistency`=3, `Freshness`=3, `Uniqueness`=4, `Validity`=3

## Rules (tab Rule Lifecycle)

- **lifecycleState**: `Reopened`=18, `Ongoing`=27, `New`=13, `Stable`=35, `Recovered`=18, `No data`=14
- **domain**: `Sales`=30, `Finance`=12, `Operations`=36, `Marketing`=21, `Compliance`=14, `Risk`=12
- **service**: `mysql_prod`=27, `postgres_dwh`=26, `snowflake_analytics`=24, `s3_datalake`=27, `bigquery_mart`=21
- **owner**: `Data Platform`=25, `Content`=25, `Finance Ops`=25, `Analytics`=26, `Marketing Ops`=24
- **ruleType**: `completeness`=27, `freshness`=26, `uniqueness`=24, `validity`=20, `accuracy`=18, `consistency`=10
- **healthDimension**: `Completeness`=27, `Freshness`=26, `Uniqueness`=24, `Validity`=20, `Accuracy`=18, `Consistency`=10
- **tier**: `Tier1`=36, `Tier2`=42, `Tier3`=47
- **businessRuleOwner**: `Sales Ops`=21, `Finance Ops`=21, `Operations Ops`=20, `Marketing Ops`=21, `Risk Ops`=21, `Compliance Ops`=21
- **recurrenceBucket**: `0`=62, `>=3`=18, `1-2`=45
- **chronic (recurrence>=3)**: 18 rules
- **latestResult**: `Fail`=58, `Pass`=53, `None`=14 (null = rule chua chay)

## Lien ket Asset <-> Rule (dung cho Asset Detail)

- Join bang `rule.assetId === asset.id` (hoac `rule.table === asset.name`).
- So rule moi asset: `0 rule`=3 asset, `3 rule`=6 asset, `4 rule`=6 asset, `5 rule`=7 asset, `6 rule`=8 asset
- Asset co rule: 27/30 — Asset KHONG co rule nao: 3 (dung cho Rule Coverage KPI o tab Overview).
- `asset.testsTotal` / `asset.testsFailed` **duoc suy ra tu chinh danh sach rule** -> phai khop 100%.
- Nhat quan: asset `Healthy` khong co rule nao dang Fail; asset `Critical` luon co >=1 rule Fail.
- Moi dimension trong `asset.failingDimensions` deu co it nhat 1 rule tuong ung dang Fail.

## Vi du kiem tra Asset Detail

- `customer` (Critical): 3/3 test fail, 3 rule -> `customer_completeness`=Reopened, `customer_freshness`=Ongoing, `customer_uniqueness`=Reopened
- `orders` (Warning): 4/6 test fail, 6 rule -> `orders_freshness`=Ongoing, `orders_completeness`=Ongoing, `orders_uniqueness`=New, `orders_validity`=Stable, `orders_accuracy`=Reopened, `orders_consistency`=Recovered
- `order_items` (Healthy): 0/5 test fail, 5 rule -> `order_items_completeness`=Stable, `order_items_freshness`=Stable, `order_items_uniqueness`=Recovered, `order_items_validity`=Stable, `order_items_accuracy`=Recovered
