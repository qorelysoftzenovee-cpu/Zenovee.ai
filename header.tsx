"use client";

import React from 'react';
import { Search, Bell, User as UserIcon, Coins } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function Header({ credits = 0 }: { credits?: number }) {
  return (
    <header className="h-16 border-b border-slate-200 bg-white px-8 flex items-center justify-between sticky top-0 z-30">
      <div className="w-full max-w-xl relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input 
          placeholder="Search for AI tools, documents, or help..." 
          className="pl-10 bg-slate-50 border-none focus-visible:ring-1 focus-visible:ring-blue-500 transition-all"
        />
      </div>

      <div className="flex items-center gap-4">
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-blue-50 rounded-full border border-blue-100">
          <Coins className="w-4 h-4 text-blue-600" />
          <span className="text-xs font-bold text-blue-700">{credits.toLocaleString()} Credits</span>
        </div>

        <Button variant="ghost" size="icon" className="relative text-slate-600 hover:text-blue-600">
          <Bell className="w-5 h-5" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full bg-slate-100 text-slate-600">
              <UserIcon className="w-5 h-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem>Profile</DropdownMenuItem>
            <DropdownMenuItem>Billing</DropdownMenuItem>
            <DropdownMenuItem className="text-red-600">Logout</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}