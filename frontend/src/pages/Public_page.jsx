import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import banner from "../image/banner-public.jpeg";
import brick from "../image/road.png";
import pic_abt from "../image/pic-abt.png";
import hat from "../image/hat.jpg";
import map from "../image/VN_map.png";
import trafficCone from "../image/trafficCone.png";
import fireHydrant from "../image/fireHydrant.png";

import {
  ArrowDownRightIcon,
  ArrowRightIcon,
  ArrowUpRightIcon,
} from "@phosphor-icons/react";

const PublicPage = () => {
  const sections = [
    { id: "home", label: "Home" },
    { id: "about", label: "About" },
    { id: "faq", label: "FAQ" },
    { id: "contact", label: "Contact" },
  ];

  const [activeSection, setActiveSection] = useState("home");
  const [openFAQ, setOpenFAQ] = useState(null);

  const faqData = [
    {
      id: 1,
      question: "Làm thế nào để gửi một báo cáo sự cố?",
      answer:
        "Bạn chỉ cần đăng nhập vào tài khoản, chọn 'Tạo báo cáo mới', chụp ảnh sự cố, mô tả chi tiết và chọn loại vấn đề. Hệ thống sẽ tự động định vị địa điểm và gửi đến cơ quan chức năng phù hợp.",
    },
    {
      id: 2,
      question: "Làm sao để theo dõi tiến độ xử lý báo cáo?",
      answer:
        "Sau khi gửi báo cáo, bạn có thể theo dõi tiến độ xử lý trong mục 'Báo cáo của tôi'. Hệ thống sẽ cập nhật trạng thái theo thời gian thực và gửi thông báo khi có thay đổi.",
    },
    {
      id: 3,
      question: "Tôi nên báo cáo những loại sự cố nào?",
      answer:
        "Bạn có thể báo cáo các vấn đề về hạ tầng công cộng như: hư hỏng đường bộ, vỉa hè, cống rãnh, chiếu sáng công cộng, cây xanh nguy hiểm, biển báo giao thông hư hại, và các sự cố liên quan đến tiện ích công cộng.",
    },
    {
      id: 4,
      question: "Tôi không có tài khoản thì có báo cáo được không?",
      answer:
        "Hiện tại bạn cần có tài khoản để gửi báo cáo và theo dõi tiến độ xử lý. Việc đăng ký rất đơn giản và nhanh chóng, giúp chúng tôi xác thực thông tin và liên hệ với bạn khi cần thiết.",
    },
    {
      id: 5,
      question: "Sau khi gửi báo cáo, mất bao lâu để được xử lý?",
      answer:
        "Thời gian xử lý phụ thuộc vào mức độ nghiêm trọng và loại sự cố. Thông thường, báo cáo sẽ được tiếp nhận trong vòng 24 giờ. Các trường hợp khẩn cấp sẽ được ưu tiên xử lý ngay lập tức.",
    },
  ];

  const toggleFAQ = (id) => {
    console.log("Toggle FAQ clicked, id:", id, "current openFAQ:", openFAQ);
    setOpenFAQ(openFAQ === id ? null : id);
  };

  const handleNavClick = (id) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      {
        threshold: 0.6,
      }
    );
    sections.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [sections]);

  return (
    <main className="h-screen w-full overflow-y-scroll snap-y snap-mandatory scroll-smooth">
      {/* ---------------------NAV--------------------- */}
      <header className="sticky top-[1px] z-[100]">
        <div className="w-full flex items-center justify-between px-8 py-2 rounded-[15px] bg-[rgba(0,0,0,0.15)] backdrop-blur-[10px] backdrop-brightness-[1.1]">
          {/* logo */}
          <span className="text-5xl font-semibold text-white -tracking-[0.1em]">
            S
            <span className="text-[44px] font-medium -tracking-[0.1em]">
              afin
            </span>
          </span>
          {/* nav */}
          <div className="flex justify-between items-center gap-10 text-lg text-white ">
            {sections.map((item) => (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={
                  "px-6 py-2 transition-all " +
                  (activeSection === item.id
                    ? "rounded-full px-7 py-2 font-medium text-white border border-solid border-white"
                    : "border border-transparent")
                }
              >
                {item.label}
              </button>
            ))}
          </div>
          {/* button */}
          <div className="flex items-center gap-3 hover:scale-105 hover:rotate-2 transition-all">
            <Link
              to="/signin"
              className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold shadow-[0_0_30px_rgba(255,255,255,0.7)]"
            >
              <span className="text-[#0033ff]">Log in</span>
              <ArrowUpRightIcon size={18} color="#0033ff" />
            </Link>
          </div>
        </div>
      </header>
      {/* ---------------------section Hero--------------------- */}
      <section id="home" className="relative w-full h-screen snap-start">
        <div className="w-full h-screen flex flex-col justify-end">
          {/* banner */}
          <div className="absolute inset-0 -z-10 overflow-hidden">
            <img
              src={banner}
              alt="City skyline"
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(69,69,69,0)_0%,#111111_66%)] opacity-45"></div>
          </div>

          {/* content */}
          <div className="relative z-10 w-[55%] flex flex-col gap-2 mx-8 mb-6">
            <p className="text-white font-medium text-7xl">
              Building a resilient <br /> and sustainable city.
            </p>
            <p className="font-light text-white text-xl">
              A platform for reporting infrastructure issues—fast, simple,
              effective.
            </p>

            <Link
              to="/signin"
              className="mt-3 inline-flex w-max items-center gap-2 rounded-full px-4 py-2 text-xl font-light text-white border border-solid border-white bg-[rgba(255,255,255,0.01)] backdrop-blur-[10px] backdrop-brightness-[1.1] hover:scale-105 hover:rotate-2 transition-all"
            >
              <span>Get Started</span>
              <ArrowRightIcon size={24} color="#ffffff" />
            </Link>
          </div>
        </div>
      </section>

      {/* ---------------------section About--------------------- */}
      <section
        id="about"
        className="relative w-full min-h-screen snap-start px-8 py-6 flex flex-col justify-between"
      >
        {/* head */}
        <div className="w-full flex justify-between items-start">
          <span className="inline-block w-[60%] italic text-[11.25rem] font-black text-[#0033ff] -tracking-[1.2rem] leading-[0.85]">
            ABOUT
            <br />
            US
          </span>

          <div className="w-[40%] rounded-3xl">
            <img
              src={pic_abt}
              alt="Team collaboration"
              className="h-full w-full object-contain "
            />
          </div>
        </div>

        {/* content */}
        <div className="w-full flex justify-between items-center pb-5">
          <span className="text-7xl font-semibold text-[#0033ff] -tracking-[0.1em]">
            S
            <span className="text-[64px] text-black font-medium -tracking-[0.1em]">
              afin
            </span>
          </span>

          <div className="w-[40%] rounded-3xl">
            <span className="inline-block">
              Là nền tảng giúp người dân ghi nhận và báo cáo các sự cố hạ tầng
              xung quanh một cách nhanh chóng, trực quan và minh bạch.
            </span>
            <span className="inline-block mt-2">
              Tạo nên{" "}
              <span className="text-[#0033ff] font-semibold italic">
                cầu nối
              </span>{" "}
              giữa cộng đồng và chính quyền, giúp cải thiện chất lượng sống và
              xây dựng đô thị an toàn, bền vững hơn.
            </span>
          </div>
        </div>

        {/* brick */}
        <div className="absolute w-[30rem] left-72 top-24">
          <img src={brick} alt="brick" className="w-full -rotate-90" />
        </div>
      </section>

      {/* ---------------------section why choose us--------------------- */}
      <section className="w-full min-h-screen snap-start px-8 py-6 flex flex-col items-center justify-center">
        {/* head */}
        <div>
          <span className="block text-[#0033ff] text-7xl italic font-black uppercase text-center -tracking-[0.09em]">
            WHY CHOOSE US?
          </span>
        </div>
        <div className="w-full flex justify-center items-end">
          <div className="max-w-6xl w-full flex items-center gap-5 mt-8">
            {/* content text */}
            <div className="w-1/2 ml-8">
              <p className="w-2/3  text-[#0033ff] text-justify text-lg leading-8 tracking-wide">
                Safin giúp việc báo cáo sự cố hạ tầng trở nên nhanh, rõ ràng và
                dễ tiếp cận cho mọi người. Nền tảng tự động kết nối thông tin
                đến đúng cơ quan chức năng, rút ngắn thời gian xử lý và tăng
                hiệu quả phản hồi. Trải nghiệm đơn giản, minh bạch và đáng tin
                cậy.
              </p>
            </div>
            {/* pic */}
            <div className="w-1/2 ml-12">
              <div className="w-[66%] h-full">
                <img
                  src={hat}
                  alt="whyyyy?"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------------section How it work--------------------- */}
      <section className="relative w-full min-h-screen snap-start px-8 py-6 flex flex-col justify-between bg-[#0033ff]">
        {/* head */}
        <div>
          <span className="block text-white text-7xl italic font-black uppercase -tracking-[0.09em]">
            how it work ?
          </span>
        </div>

        {/* content */}
        <div className="w-full flex flex-col gap-12 text-white my-auto">
          <div className="flex items-center justify-between border-b-2 border-white pb-4">
            <span className="text-7xl italic font-black -tracking-[0.09em]">
              01
            </span>
            <span className="uppercase font-semibold text-xl">gửi báo cáo</span>
            <span className="w-1/4 text-end">
              Chụp ảnh, mô tả, chọn loại vấn đề và hệ thống tự định vị
            </span>
          </div>

          <div className="flex items-center justify-between border-b-2 border-white pb-4">
            <span className="text-7xl italic font-black -tracking-[0.09em]">
              02
            </span>
            <span className="uppercase font-semibold text-xl">
              phân loại & chuyển xử lý
            </span>
            <span className="w-1/4 text-end">
              Đơn tự động gửi đến đúng đơn vị chức năng
            </span>
          </div>

          <div className="flex items-center justify-between border-b-2 border-white pb-4">
            <span className="text-7xl italic font-black -tracking-[0.09em]">
              03
            </span>
            <span className="uppercase font-semibold text-xl">
              theo dõi tiến độ giải quyết
            </span>
            <span className="w-1/4 text-end">
              Cập nhật trạng thái xử lý theo thời gian thực
            </span>
          </div>
        </div>
      </section>

      {/* ---------------------section Location--------------------- */}
      <section className="relative w-full min-h-screen snap-start px-8 py-6 flex items-center">
        <div className="w-1/2 flex justify-center">
          <span className="block text-[#0033ff] text-7xl italic text-center font-black uppercase -tracking-[0.04em]">
            Nationwide
            <br />
            Presence!
          </span>
        </div>

        <div className="w-1/2 flex justify-center">
          <img src={map} alt="Vietnam Map" />
        </div>
      </section>

      {/* ---------------------section FAQ--------------------- */}
      <section
        id="faq"
        className="w-full min-h-screen snap-start px-8 py-6 flex flex-col  gap-14"
      >
        {/* head */}
        <div className="relative">
          <span className="block italic text-[11.25rem] font-black text-[#0033ff] -tracking-[1.2rem] leading-[0.85]">
            FAQ
          </span>

          <div className="absolute -top-10 right-20 -rotate-45">
            <img
              src={trafficCone}
              alt="FAQ Illustration"
              className="w-[20rem]"
            />
          </div>
        </div>

        {/* content */}
        <div className="w-full flex justify-between">
          <div className="w-full">
            <div className="flex flex-col gap-4">
              {faqData.map((faq) => (
                <div
                  key={faq.id}
                  className="border-b-2 border-solid border-[#0033ff] pb-2"
                >
                  <button
                    onClick={() => toggleFAQ(faq.id)}
                    className="w-full cursor-pointer text-[#0033ff] text-xl font-medium flex items-center justify-between transition-all hover:opacity-80"
                  >
                    <span className="text-left">{faq.question}</span>
                    <ArrowDownRightIcon
                      size={32}
                      color="#0033ff"
                      className={`transition-transform duration-300 ${
                        openFAQ === faq.id ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                  <div
                    className={`overflow-hidden transition-all duration-300 ease-in-out ${
                      openFAQ === faq.id
                        ? "max-h-[500px] opacity-100 mt-4"
                        : "max-h-0 opacity-0"
                    }`}
                  >
                    <p className="w-[70%] text-gray-600 text-base font-medium leading-7 pr-12">
                      {faq.answer}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ---------------------section quotes--------------------- */}
      <section className="w-full min-h-screen snap-start px-8 py-6 flex flex-col bg-[#0033ff] text-white -tracking-[0.75em]">
        <div className="relative w-full flex flex-col leading-none space-y-2">
          <div className="w-full flex justify-between uppercase font-semibold text-[3.5rem] md:text-[5.5rem] lg:text-[8.5rem]">
            <span>Your</span>
            <span>voice</span>
          </div>

          <div className="w-full flex items-center gap-4 uppercase font-semibold text-[3.5rem] md:text-[5.5rem] lg:text-[8.5rem]">
            <ArrowRightIcon size={180} weight="bold" />
            <span>matters</span>
          </div>

          <div className="w-full uppercase font-semibold text-[3.5rem] md:text-[5.5rem] lg:text-[8.5rem]">
            <span>to</span>
          </div>

          <div className="w-full uppercase text-[3.5rem] md:text-[5.5rem] lg:text-[8.5rem] font-semibold">
            <span className="block text-center pl-96">us</span>
          </div>

          <div className="absolute w-56 h-auto top-56 right-0 ">
            <img src={fireHydrant} alt="fire hydrant" />
          </div>
        </div>
      </section>

      {/* ---------------------section Contact--------------------- */}
      <section
        id="contact"
        className="w-full h-screen snap-start px-8 py-12 flex flex-col"
      >
        {/* TOP */}
        <div className="w-full flex justify-between flex-1">
          <span className="w-2/3 italic text-[8rem] font-black text-[#0033ff] -tracking-[0.5rem] leading-[0.85]">
            CONNECT
            <br />
            WITH
          </span>

          <div className="w-1/3 text-sm flex flex-col items-end text-right text-gray-400">
            <span>
              FOR IMMEDIATE ASSISTANCE, PLEASE <br /> EMAIL US OR CALL US.
            </span>
          </div>
        </div>

        {/* MIDDLE */}
        <div className="w-full flex justify-between items-center flex-1 text-xs md:text-sm text-gray-400">
          <div className="flex-1 flex flex-col items-start">
            <span>SUPPORT HOURS</span>
            <span>09:00 — 17:30</span>
          </div>

          <div className="flex-1 flex flex-col items-center text-center">
            <span>AVERAGE RESPONSE</span>
            <span>WITHIN 24 HOURS</span>
          </div>

          <div className="flex-1 flex flex-col items-center text-center">
            <span>KNOWLEDGE BASE</span>
            <span>DOCUMENTATION</span>
          </div>

          <div className="flex-1 flex flex-col items-end text-right">
            <span>CUSTOMER SUPPORT</span>
            <span>COMMUNITY TEAM</span>
          </div>
        </div>

        {/* BOTTOM */}
        <div className="w-full flex justify-between items-end flex-1">
          <span className="italic text-[7rem] md:text-[8rem] font-black text-[#0033ff] -tracking-[0.5rem] leading-[0.85]">
            US
          </span>

          <span className="text-sm flex flex-col justify-center items-center font- underline text-gray-800">
            03 Quang Trung Street, DaNang city, VietNam <br />
            (084) 456-7890
          </span>

          <span className="text-[6.5rem] font-semibold text-[#0033ff] -tracking-[0.1em] leading-[0.85]">
            S
            <span className="text-[6rem] text-black font-medium -tracking-[0.1em] leading-[0.85]">
              afin
            </span>
          </span>
        </div>
      </section>
    </main>
  );
};

export default PublicPage;
