import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class SampleDataService {
  private samples = [
    {
      name: '用户配置差异',
      left: `{
  "name": "张三",
  "age": 28,
  "email": "zhangsan@example.com",
  "preferences": {
    "theme": "light",
    "notifications": true,
    "language": "zh-CN"
  },
  "tags": ["developer", "designer"],
  "active": true
}`,
      right: `{
  "name": "张三",
  "age": 29,
  "email": "zhangsan@newmail.com",
  "preferences": {
    "theme": "dark",
    "notifications": false,
    "language": "zh-CN",
    "timezone": "Asia/Shanghai"
  },
  "tags": ["developer", "manager"],
  "active": true,
  "lastLogin": "2024-01-15T10:30:00Z"
}`
    },
    {
      name: '数组和嵌套对象',
      left: `{
  "company": {
    "name": "科技有限公司",
    "address": {
      "city": "北京",
      "street": "中关村大街1号"
    },
    "departments": [
      { "id": 1, "name": "技术部", "employees": 50 },
      { "id": 2, "name": "市场部", "employees": 30 },
      { "id": 3, "name": "人事部", "employees": 10 }
    ]
  },
  "metadata": {
    "version": "1.0.0",
    "createdAt": "2023-01-01"
  }
}`,
      right: `{
  "company": {
    "name": "科技集团股份有限公司",
    "address": {
      "city": "北京",
      "street": "中关村大街1号",
      "postalCode": "100080"
    },
    "departments": [
      { "id": 1, "name": "技术研发部", "employees": 60 },
      { "id": 2, "name": "市场营销部", "employees": 35 },
      { "id": 3, "name": "产品部", "employees": 20 }
    ]
  },
  "metadata": {
    "version": "2.0.0",
    "updatedAt": "2024-01-01"
  }
}`
    },
    {
      name: '大型嵌套结构',
      left: `{
  "id": "order-001",
  "customer": {
    "id": "cust-123",
    "name": "李四",
    "contact": {
      "phone": "13800138000",
      "email": "lisi@example.com",
      "address": {
        "province": "广东省",
        "city": "深圳市",
        "district": "南山区",
        "detail": "科技园路88号"
      }
    }
  },
  "items": [
    {
      "id": "item-001",
      "name": "笔记本电脑",
      "quantity": 1,
      "price": 5999.00,
      "specs": {
        "cpu": "Intel i5",
        "ram": "16GB",
        "storage": "512GB SSD"
      }
    },
    {
      "id": "item-002",
      "name": "无线鼠标",
      "quantity": 2,
      "price": 99.00
    }
  ],
  "status": "pending",
  "totalAmount": 6197.00,
  "createdAt": "2024-01-10T09:00:00Z"
}`,
      right: `{
  "id": "order-001",
  "customer": {
    "id": "cust-123",
    "name": "李四",
    "contact": {
      "phone": "13900139000",
      "email": "lisi@example.com",
      "address": {
        "province": "广东省",
        "city": "广州市",
        "district": "天河区",
        "detail": "科技园路88号"
      }
    }
  },
  "items": [
    {
      "id": "item-001",
      "name": "笔记本电脑",
      "quantity": 1,
      "price": 6299.00,
      "specs": {
        "cpu": "Intel i7",
        "ram": "32GB",
        "storage": "1TB SSD"
      }
    }
  ],
  "status": "confirmed",
  "totalAmount": 6299.00,
  "createdAt": "2024-01-10T09:00:00Z",
  "confirmedAt": "2024-01-10T10:30:00Z",
  "payment": {
    "method": "alipay",
    "transactionId": "ALI-20240110-12345"
  }
}`
    }
  ];

  getSamples() {
    return this.samples;
  }

  getSample(index: number) {
    return this.samples[index] || null;
  }
}
