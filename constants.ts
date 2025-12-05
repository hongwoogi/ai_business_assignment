import { Grant } from './types';

export const MOCK_GRANTS: Grant[] = [
  {
    id: 'DTG2024',
    title: '2024년 중소기업 디지털 전환 지원사업',
    supportAmount: '최대 5,000만원',
    period: '2024-01-01 ~ 2024-06-30',
    deadline: '2025-01-31',
    description: '중소기업의 디지털 경쟁력 강화를 위해 클라우드, AI 등 신기술 도입을 지원하는 사업입니다. 제조, 서비스 등 다양한 분야의 디지털 전환을 희망하는 기업을 대상으로 합니다.',
    region: '서울',
    industry: 'IT/SW',
    status: 'Open'
  },
  {
    id: 'SBIF2024',
    title: '2024년 창업성장 기술개발사업',
    supportAmount: '최대 1억 5천만원',
    period: '2024-03-01 ~ 2024-12-31',
    deadline: '2025-03-15',
    description: '성장 잠재력을 보유한 창업기업의 R&D를 지원하여 기술기반 창업을 활성화하고 혁신성장을 촉진하기 위한 지원사업입니다.',
    region: '경기',
    industry: '제조',
    status: 'Open'
  },
  {
    id: 'GEI2023',
    title: '신재생에너지 보급 지원사업',
    supportAmount: '설치비의 70% 이내',
    period: '2023-06-01 ~ 2024-06-01',
    deadline: '2024-12-31',
    description: '탄소중립 실현을 위해 공장 및 사업장에 태양광 등 신재생에너지 설비 설치를 지원합니다.',
    region: '부산',
    industry: '에너지/환경',
    status: 'Closed'
  },
  {
    id: 'BIO2024',
    title: '바이오 헬스케어 글로벌 진출 지원',
    supportAmount: '최대 3,000만원',
    period: '2024-02-01 ~ 2024-08-31',
    deadline: '2024-09-15',
    description: '국내 유망 바이오/헬스케어 기업의 해외 시장 개척 및 수출 증대를 위한 마케팅 및 전시회 참가를 지원합니다.',
    region: '전국',
    industry: '바이오/헬스',
    status: 'Open'
  }
];

export const USER_AVATAR_URL = "https://lh3.googleusercontent.com/aida-public/AB6AXuAodchSFfYm6XSZysAwvyY7J-LOfW-t32GBiiCGaXhSxezz4ynWJvbVCVvTPniAYrIWtw1GpScb3vUqL3m-lsFy33d1kc8ryQzuUyRYpGYclVPoPOff8PXA6jVWZsvn-O4oHllZsGbvxXM8sm6HMbmqOazmUuCygrlL3wAe0YSJPjA7oztWZHVOQy_7My6iLv-bJWR_2xzUUfKjGRqXf7YZS8EX2ZYl5LBcl6IpYjAyfTvokK9QRbW8D9ogHH_5FTRv0oZcbsJ1uA";