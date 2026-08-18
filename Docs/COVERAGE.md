# COVERAGE — mock data (30 assets + 135 rules)

> Sinh tat dinh tu gen.py, anchor 2026-08-18T09:00:00+07:00. Moi con so duoi day la 1 assertion phai dung.

## Assets (tab Overview / Health)

- **healthStatus**: `Critical`=6, `Healthy`=12, `Unknown`=3, `Warning`=9
- **domain**: `Compliance`=4, `Finance`=4, `Marketing`=5, `Operations`=8, `Risk`=3, `Sales`=6
- **service**: `bigquery_mart`=6, `mysql_prod`=6, `postgres_dwh`=6, `s3_datalake`=6, `snowflake_analytics`=6
- **owner**: `Analytics`=6, `Content`=6, `Data Platform`=6, `Finance Ops`=6, `Marketing Ops`=6
- **tier**: `Tier1`=10, `Tier2`=10, `Tier3`=10
- **failing healthDimension**: `Accuracy`=4, `Completeness`=4, `Consistency`=3, `Freshness`=3, `Uniqueness`=4, `Validity`=3

## Rules (tab Rule Lifecycle)

- **lifecycleState**: `New`=13, `No data`=14, `Ongoing`=27, `Recovered`=21, `Reopened`=18, `Stable`=42
- **domain**: `Compliance`=17, `Finance`=16, `Marketing`=24, `Operations`=36, `Risk`=12, `Sales`=30
- **service**: `bigquery_mart`=25, `mysql_prod`=27, `postgres_dwh`=29, `s3_datalake`=27, `snowflake_analytics`=27
- **owner**: `Analytics`=27, `Content`=27, `Data Platform`=27, `Finance Ops`=27, `Marketing Ops`=27
- **ruleType**: `accuracy`=18, `completeness`=30, `consistency`=10, `freshness`=29, `uniqueness`=27, `validity`=21
- **healthDimension**: `Accuracy`=18, `Completeness`=30, `Consistency`=10, `Freshness`=29, `Uniqueness`=27, `Validity`=21
- **tier**: `Tier1`=43, `Tier2`=45, `Tier3`=47
- **businessRuleOwner**: `Compliance Ops`=22, `Finance Ops`=23, `Marketing Ops`=22, `Operations Ops`=23, `Risk Ops`=22, `Sales Ops`=23
- **recurrenceBucket**: `0`=69, `1-2`=48, `>=3`=18
- **chronic (recurrence>=3)**: 18 rules
- **latestResult**: `Fail`=58, `None`=14, `Pass`=63 (null = rule chua chay)

## Lien ket Asset <-> Rule (dung cho Asset Detail)

- Join bang `rule.assetId === asset.id` (hoac `rule.table === asset.name`).
- So rule moi asset: `3 rule`=8 asset, `4 rule`=7 asset, `5 rule`=7 asset, `6 rule`=8 asset
- `asset.testsTotal` / `asset.testsFailed` **duoc suy ra tu chinh danh sach rule** -> phai khop 100%.
- Nhat quan: asset `Healthy` khong co rule nao dang Fail; asset `Critical` luon co >=1 rule Fail.
- Moi dimension trong `asset.failingDimensions` deu co it nhat 1 rule tuong ung dang Fail.

## Vi du kiem tra Asset Detail

- `customer` (Critical): 3/3 test fail, 3 rule -> `customer_completeness`=Reopened, `customer_freshness`=Ongoing, `customer_uniqueness`=Reopened
- `orders` (Warning): 4/6 test fail, 6 rule -> `orders_freshness`=Ongoing, `orders_completeness`=Ongoing, `orders_uniqueness`=New, `orders_validity`=Stable, `orders_accuracy`=Reopened, `orders_consistency`=Recovered
- `order_items` (Healthy): 0/5 test fail, 5 rule -> `order_items_completeness`=Stable, `order_items_freshness`=Stable, `order_items_uniqueness`=Recovered, `order_items_validity`=Stable, `order_items_accuracy`=Recovered