import React from 'react';
import { Link } from 'react-router-dom';
import { USER_AVATAR_URL } from '../constants';

const Header: React.FC = () => {
  return (
    <header className="flex h-16 shrink-0 items-center justify-between whitespace-nowrap border-b border-solid border-slate-200 bg-neutral-white px-6 z-20">
      <div className="flex items-center gap-4 text-neutral-dark-gray">
        <Link to="/" className="flex items-center gap-4 hover:opacity-80 transition-opacity">
          <div className="size-8 text-corporate-blue">
            <svg fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
              <g clipPath="url(#clip0_6_535)">
                <path clipRule="evenodd" d="M47.2426 24L24 47.2426L0.757355 24L24 0.757355L47.2426 24ZM12.2426 21H35.7574L24 9.24264L12.2426 21Z" fill="currentColor" fillRule="evenodd"></path>
              </g>
              <defs>
                <clipPath id="clip0_6_535">
                  <rect fill="white" height="48" width="48"></rect>
                </clipPath>
              </defs>
            </svg>
          </div>
          <h2 className="text-xl font-bold tracking-tight">정부지원사업 공고 해결사</h2>
        </Link>
      </div>
      <div className="flex items-center gap-4">
        <div className="flex flex-col items-end">
          <p className="text-sm font-medium text-neutral-dark-gray">김철수</p>
          <span className="text-xs text-neutral-medium-gray">관리자</span>
        </div>
        <div 
          className="bg-center bg-no-repeat bg-cover rounded-full size-10 border border-slate-200 shadow-sm"
          style={{ backgroundImage: `url("${USER_AVATAR_URL}")` }}
          aria-label="사용자 아바타"
        ></div>
      </div>
    </header>
  );
};

export default Header;