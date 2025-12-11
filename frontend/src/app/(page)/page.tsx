/* eslint-disable @next/next/no-img-element */
"use client";

import Banner from "@/components/home/Banner";
import PopularSlots from "@/components/home/PopularSlots";
import Features from "@/components/home/Features";
import UpcomingTournaments from "@/components/home/UpcomingTournaments";
import Blogs from "@/components/home/Blogs";
import Reviews from "@/components/home/Reviews";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-linear-to-br from-slate-50 via-white to-emerald-50">
      <PopularSlots />
      <Features />
      <UpcomingTournaments />
      <Blogs />
      <Banner />
      <Reviews />
    </main>
  );
}
