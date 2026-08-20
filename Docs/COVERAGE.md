# COVERAGE — mock data (30 assets + 647 rules)

> Sinh tat dinh tu gen.py + tools/generate-coverage.js, anchor 2026-08-18T09:00:00+07:00. Moi con so duoi day la 1 assertion phai dung.

## Assets (tab Overview / Health)

- **healthStatus**: `Critical`=10, `Healthy`=6, `Unmonitored`=3, `Warning`=11
- **domain**: `Sales`=6, `Finance`=4, `Operations`=8, `Marketing`=5, `Compliance`=4, `Risk`=3
- **service**: `mysql_prod`=6, `postgres_dwh`=6, `snowflake_analytics`=6, `bigquery_mart`=6, `s3_datalake`=6
- **owner**: `Data Platform`=6, `Marketing Ops`=6, `Analytics`=6, `Finance Ops`=6, `Content`=6
- **tier**: `Tier1`=10, `Tier2`=10, `Tier3`=10
- **failing healthDimension**: `Accuracy`=14, `Completeness`=16, `Consistency`=9, `Freshness`=14, `Uniqueness`=10, `Validity`=9

## Rules (tab Rule Lifecycle)

- **lifecycleState**: `Ongoing`=138, `Stable`=440, `Reopened`=27, `New`=42
- **domain**: `Sales`=149, `Finance`=72, `Operations`=193, `Marketing`=87, `Compliance`=74, `Risk`=72
- **service**: `mysql_prod`=150, `postgres_dwh`=120, `snowflake_analytics`=128, `s3_datalake`=132, `bigquery_mart`=117
- **owner**: `Data Platform`=146, `Finance Ops`=137, `Content`=133, `Marketing Ops`=103, `Analytics`=128
- **ruleType**: `accuracy`=106, `completeness`=103, `uniqueness`=108, `validity`=112, `consistency`=106, `freshness`=112
- **healthDimension**: `Accuracy`=106, `Completeness`=103, `Uniqueness`=108, `Validity`=112, `Consistency`=106, `Freshness`=112
- **tier**: `Tier1`=190, `Tier2`=214, `Tier3`=243
- **businessRuleOwner**: `Risk Ops`=114, `Marketing Ops`=102, `Sales Ops`=108, `Operations Ops`=103, `Compliance Ops`=112, `Finance Ops`=108
- **recurrenceBucket**: `0`=264, `1-2`=383
- **chronic (recurrence>=3)**: 0 rules
- **latestResult**: `Fail`=207, `Pass`=440 (null = rule chua chay)

## Lien ket Asset <-> Rule (dung cho Asset Detail)

- Join bang `rule.assetId === asset.id` (hoac `rule.table === asset.name`).
- So rule moi asset: `0 rule`=3 asset, `21 rule`=4 asset, `22 rule`=4 asset, `23 rule`=5 asset, `24 rule`=4 asset, `25 rule`=1 asset, `26 rule`=4 asset, `27 rule`=5 asset
- Asset co rule: 27/30 — Asset KHONG co rule nao: 3 (dung cho Rule Coverage KPI o tab Overview).
- `asset.testsTotal` / `asset.testsFailed` **duoc suy ra tu chinh danh sach rule** -> phai khop 100%.
- Nhat quan: asset `Healthy` khong co rule nao dang Fail; asset `Critical` luon co >=1 rule Fail.
- Moi dimension trong `asset.failingDimensions` deu co it nhat 1 rule tuong ung dang Fail.

## Vi du kiem tra Asset Detail

- `customer` (Critical): 3/3 test fail, 3 rule -> `customer_completeness`=Reopened, `customer_freshness`=Ongoing, `customer_uniqueness`=Reopened
- `orders` (Warning): 4/6 test fail, 6 rule -> `orders_freshness`=Ongoing, `orders_completeness`=Ongoing, `orders_uniqueness`=New, `orders_validity`=Stable, `orders_accuracy`=Reopened, `orders_consistency`=Recovered
- `order_items` (Healthy): 0/5 test fail, 5 rule -> `order_items_completeness`=Stable, `order_items_freshness`=Stable, `order_items_uniqueness`=Recovered, `order_items_validity`=Stable, `order_items_accuracy`=Recovered
