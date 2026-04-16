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
    },
    {
      name: '大JSON性能测试 (500+节点)',
      left: this.generateLargeJson(200),
      right: this.generateLargeJson(200, true)
    }
  ];

  private generateLargeJson(count: number, withChanges: boolean = false): string {
    const data: any = {
      metadata: {
        version: "1.0.0",
        generatedAt: "2024-01-15T10:30:00Z",
        source: "performance-test",
        totalRecords: count
      },
      records: [],
      categories: {},
      stats: {
        total: count,
        active: 0,
        inactive: 0,
        pending: 0
      }
    };

    const firstNames = ['张伟', '王伟', '李娜', '刘洋', '王芳', '刘强', '王宁', '李刚', '张勇', '刘洋',
      '陈晨', '杨帆', '黄磊', '周杰', '吴涛', '郑爽', '赵敏', '孙俪', '刘涛', '胡军'];
    const lastNames = ['张', '王', '李', '刘', '陈', '杨', '黄', '周', '吴', '赵',
      '徐', '孙', '马', '朱', '胡', '林', '何', '高', '梁', '郑'];
    const cities = ['北京', '上海', '广州', '深圳', '杭州', '成都', '武汉', '南京', '西安', '重庆'];
    const departments = ['技术部', '市场部', '产品部', '运营部', '人事部', '财务部', '法务部', '客服部'];
    const statuses = ['active', 'inactive', 'pending'];
    const tags = ['vip', 'new', 'regular', 'premium', 'trial', 'enterprise'];
    const categories = ['A类', 'B类', 'C类', 'D类', 'E类'];

    for (let i = 0; i < count; i++) {
      const firstName = firstNames[i % firstNames.length];
      const lastName = lastNames[Math.floor(i / firstNames.length) % lastNames.length];
      const city = cities[i % cities.length];
      const dept = departments[i % departments.length];
      const status = statuses[i % statuses.length];
      const userTags = tags.slice(0, (i % 3) + 1);
      const category = categories[i % categories.length];

      if (status === 'active') data.stats.active++;
      else if (status === 'inactive') data.stats.inactive++;
      else data.stats.pending++;

      const changeMultiplier = withChanges ? (i % 7 === 0 ? 1 : 0) : 0;
      
      data.records.push({
        id: `EMP-${String(i + 1000).padStart(6, '0')}`,
        name: `${lastName}${firstName}`,
        age: 22 + (i % 30),
        email: `employee${i + 1}@company.com`,
        phone: `138${String(10000000 + i).slice(0, 8)}`,
        department: dept,
        position: {
          title: i % 5 === 0 ? '经理' : i % 3 === 0 ? '主管' : '员工',
          level: `L${(i % 5) + 1}`,
          yearsInRole: (i % 10) + 1
        },
        address: {
          city: city,
          district: `第${(i % 10) + 1}区`,
          street: `${city}市科技园路${(i % 100) + 1}号`,
          postalCode: `${100000 + (i % 900000)}`,
          coordinates: {
            lat: 30.5 + (i % 100) * 0.01,
            lng: 104.0 + (i % 100) * 0.01
          }
        },
        status: status,
        salary: 8000 + (i % 20) * 500 + changeMultiplier * 2000,
        joinDate: `202${(i % 5)}-${String((i % 12) + 1).padStart(2, '0')}-${String((i % 28) + 1).padStart(2, '0')}`,
        tags: userTags,
        skills: {
          primary: ['JavaScript', 'TypeScript', 'React', 'Vue', 'Angular'][i % 5],
          secondary: ['Node.js', 'Python', 'Java', 'Go', 'Rust'][i % 5],
          languages: ['中文', '英语', (i % 3 === 0 ? '日语' : i % 5 === 0 ? '韩语' : null)].filter(Boolean),
          certifications: i % 4 === 0 ? ['PMP', 'AWS'] : i % 3 === 0 ? ['CPA'] : []
        },
        performance: {
          lastQuarter: {
            score: 70 + (i % 30),
            rating: ['A', 'B', 'C', 'D'][i % 4],
            comments: `表现${['优秀', '良好', '合格', '待改进'][i % 4]}`
          },
          goals: [
            {
              id: `G${i}01`,
              description: '完成季度目标',
              progress: Math.min(100, (i % 80) + 20),
              target: 100,
              priority: ['high', 'medium', 'low'][i % 3]
            },
            {
              id: `G${i}02`,
              description: '技能提升计划',
              progress: Math.min(100, (i % 60) + 10),
              target: 100,
              priority: ['high', 'medium'][i % 2]
            }
          ]
        },
        benefits: {
          healthInsurance: true,
          housingAllowance: i % 3 === 0,
          transportationAllowance: i % 2 === 0,
          mealAllowance: true,
          annualLeave: 10 + (i % 10),
          sickLeave: 12 + (i % 6)
        },
        emergencyContact: {
          name: `${lastNames[(i + 5) % lastNames.length]}${firstNames[(i + 3) % firstNames.length]}`,
          relationship: ['配偶', '父母', '兄弟姐妹', '朋友'][i % 4],
          phone: `139${String(20000000 + i).slice(0, 8)}`
        },
        notes: i % 5 === 0 ? `该员工${withChanges && i % 11 === 0 ? '已晋升' : '表现稳定'}，重点关注` : null,
        lastUpdated: `202${(i % 5)}-${String((i % 12) + 1).padStart(2, '0')}-${String((i % 28) + 1).padStart(2, '0')}T1${(i % 10)}:00:00Z`
      });

      if (!data.categories[category]) {
        data.categories[category] = {
          name: category,
          count: 0,
          records: []
        };
      }
      data.categories[category].count++;
      data.categories[category].records.push(`EMP-${String(i + 1000).padStart(6, '0')}`);
    }

    return JSON.stringify(data, null, 2);
  }

  getSamples() {
    return this.samples;
  }

  getSample(index: number) {
    return this.samples[index] || null;
  }
}
