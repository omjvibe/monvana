import {
  Header,
  Hero,
  FeaturedShowcase,
  Statistics,
  Partners,
  AboutUs,
  BankingTools,
  WhyChooseUs,
  ExchangeRates,
  Benefits,
  CurrencyProfiles,
  Reviews,
  Blog,
  CTA,
  Footer,
  LoanShowcase,
} from "@/components/marketing";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <Hero />
        <Statistics />
        <Partners />
        <AboutUs />
        <BankingTools />
        <FeaturedShowcase />
        <LoanShowcase />
        <WhyChooseUs />
        <ExchangeRates />
        <Benefits />
        <CurrencyProfiles />
        <Reviews />
        <Blog />
        <CTA />
      </main>
      <Footer />
    </div>
  );
}

