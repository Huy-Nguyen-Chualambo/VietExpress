import Header from '@/components/Header'
import Hero from '@/components/Hero'
import Services from '@/components/Services'
import Routes from '@/components/Routes'
import QuoteForm from '@/components/QuoteForm'
import Footer from '@/components/Footer'

export default function Home() {
  return (
    <>
      <Header />
      <main className="flex-1">
        <Hero />
        <Services />
        <Routes />
        <QuoteForm />
      </main>
      <Footer />
    </>
  )
}
