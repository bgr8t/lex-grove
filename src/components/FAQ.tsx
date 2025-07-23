import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { cn } from '@/lib/utils';

interface FAQProps {
  className?: string;
}

const faqs = [
  {
    question: "Is the AI case brief generator accurate?",
    answer: "Yes, our AI is trained on thousands of legal documents and uses advanced natural language processing to ensure accuracy. However, we always recommend reviewing AI-generated content and consulting with legal professionals for critical matters. Our AI provides a strong foundation that saves you time while maintaining high quality standards."
  },
  {
    question: "How does the community library work?",
    answer: "Our community library is a collaborative knowledge base where law students and legal professionals share case briefs, analyses, and insights. All content is moderated for quality and accuracy. You can search, save, and organize briefs by topic, jurisdiction, or course. Contributing to the library also helps build your professional reputation within the legal community."
  },
  {
    question: "Is my data secure with the Compose email feature?",
    answer: "Absolutely. We take privacy and security seriously. All email drafts are processed with end-to-end encryption, and you have full control over privacy settings. You can choose different privacy levels for different types of communications, and we never store sensitive client information. Our servers are SOC 2 compliant and follow industry-best security practices."
  },
  {
    question: "What citation formats do you support?",
    answer: "We support all major legal citation formats including McGill Guide (Canadian legal citation), Bluebook (US), OSCOLA (UK), and AGLC (Australian). Our AI automatically detects and applies the appropriate citation format based on your preferences and jurisdiction. You can also manually override citation styles for specific documents."
  },
  {
    question: "Who is Lex Briefs AI for?",
    answer: "Lex Briefs AI is designed for law students, paralegals, junior associates, and legal professionals who want to streamline their research and writing processes. Whether you're preparing for class, drafting case briefs, conducting legal research, or writing professional correspondence, our platform adapts to your needs and experience level."
  },
  {
    question: "How much does Lex Briefs AI cost?",
    answer: "We offer a free tier that includes basic case brief generation and limited library access. Our Pro plans start at $29/month for students and include unlimited AI generation, full library access, Agora platform privileges, and advanced Compose features. We also offer institutional licensing for law schools and firms."
  },
  {
    question: "Can I use this for my law school assignments?",
    answer: "Yes, Lex Briefs AI is an excellent study aid for law school. Use our platform to generate initial case briefs, research similar cases, and organize your study materials. However, always check your institution's academic integrity policies and use our tools to enhance your understanding rather than replace your own analysis and critical thinking."
  },
  {
    question: "Do you offer customer support?",
    answer: "We provide comprehensive support through multiple channels including in-app chat, email support, and extensive documentation. Pro users receive priority support with faster response times. We also maintain an active community forum where users share tips and best practices."
  }
];

export const FAQ = ({ className }: FAQProps) => {
  return (
    <section className={cn("py-16 md:py-24 bg-muted/30", className)}>
      <div className="container px-4 mx-auto">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12 md:mb-16">
            <h2 className="text-3xl md:text-4xl font-medium tracking-tight mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-xl text-muted-foreground">
              Everything you need to know about Lex Briefs AI and how it can transform your legal work.
            </p>
          </div>
          
          <Accordion type="single" collapsible className="space-y-4">
            {faqs.map((faq, index) => (
              <AccordionItem
                key={index}
                value={`item-${index}`}
                className="glass-panel rounded-lg border border-border/50 px-6"
              >
                <AccordionTrigger className="text-left hover:no-underline py-6">
                  <span className="font-semibold">{faq.question}</span>
                </AccordionTrigger>
                <AccordionContent className="pb-6 pt-0 text-muted-foreground leading-relaxed">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
          
          <div className="text-center mt-12">
            <p className="text-muted-foreground mb-4">
              Still have questions? We're here to help.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="mailto:support@lexbriefs.ai"
                className="inline-flex items-center justify-center h-10 px-6 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
              >
                Contact Support
              </a>
              <a
                href="/docs"
                className="inline-flex items-center justify-center h-10 px-6 border border-border rounded-md hover:bg-accent transition-colors"
              >
                View Documentation
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FAQ; 