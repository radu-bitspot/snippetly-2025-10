import React from 'react';
import styled from 'polotno/utils/styled';

const Page = styled('div')`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(180deg, #fff 0%, #f7f7fb 100%);
  padding: 40px;
  box-sizing: border-box;
`;

const Card = styled('div')`
  width: 100%;
  max-width: 1100px;
  background: #ffffff;
  border-radius: 20px;
  box-shadow: 0 20px 60px rgba(31, 41, 55, 0.08);
  padding: 48px;
  display: flex;
  gap: 36px;
  align-items: center;
  position: relative;
`;

const Left = styled('div')`
  flex: 1 1 60%;
`;

const Right = styled('div')`
  flex: 1 1 40%;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const H1 = styled('h1')`
  font-size: 36px;
  margin: 0 0 12px 0;
  color: #0f172a;
`;

const Lead = styled('p')`
  color: #475569;
  font-size: 16px;
  margin: 0 0 24px 0;
  line-height: 1.6;
`;

const CTAGroup = styled('div')`
  display: flex;
  gap: 12px;
`;

const Primary = styled('button')`
  background: linear-gradient(90deg,#111827,#4f46e5);
  color: white;
  border: none;
  padding: 12px 20px;
  border-radius: 10px;
  font-weight: 700;
  cursor: pointer;
`;

const Secondary = styled('button')`
  background: transparent;
  border: 2px solid #e5e7eb;
  padding: 10px 18px;
  border-radius: 10px;
  cursor: pointer;
`;

const PolotnoCard = styled('div')`
  background: linear-gradient(135deg, #f8f7ff 0%, #f0ebff 100%);
  border: 2px solid #e9d5ff;
  border-radius: 12px;
  padding: 16px 20px;
  margin: 16px 0;
  box-shadow: 0 4px 16px rgba(139, 92, 246, 0.1);
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(139, 92, 246, 0.15);
  }
`;

const PolotnoTitle = styled('h3')`
  margin: 0 0 8px 0;
  font-size: 16px;
  color: #6b21a8;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 6px;
`;

const PolotnoText = styled('p')`
  color: #4c1d95;
  font-size: 13px;
  line-height: 1.5;
  margin: 0 0 10px 0;
`;

const PolotnoButton = styled('a')`
  display: inline-block;
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  color: white;
  padding: 8px 18px;
  border-radius: 8px;
  font-weight: 700;
  font-size: 13px;
  text-decoration: none;
  cursor: pointer;
  box-shadow: 0 4px 14px rgba(99, 102, 241, 0.25);
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(99, 102, 241, 0.35);
    background: linear-gradient(135deg, #7c3aed 0%, #a78bfa 100%);
  }

  &:active {
    transform: translateY(-1px);
  }
`;

const FeatureGrid = styled('div')`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
  margin-top: 28px;
`;

const Feature = styled('div')`
  padding: 14px 16px;
  background: #f1f5f9; /* slightly darker */
  border-radius: 10px;
  border: 1px solid #e2e8f0; /* stronger border */
  color: #0f172a;
`;

const Illustration = styled('div')`
  width: 100%;
  min-height: 220px;
  background: transparent;
  border-radius: 12px;
  display: flex;
  align-items: flex-start;
  justify-content: flex-start;
  color: #334155;
  font-weight: 400;
  flex-direction: column;
`;

const MainLanding = ({ onStart, onRequestLogin }) => {
  return (
    <Page>
      <Card>
        {/* Top-right login button */}
        <div style={{ position: 'absolute', top: 20, right: 20 }}>
          <button
            onClick={() => onRequestLogin && onRequestLogin()}
            style={{
              padding: '10px 16px',
              borderRadius: 10,
              border: 'none',
              background: 'linear-gradient(90deg,#111827,#4f46e5)',
              color: '#ffffff',
              cursor: 'pointer',
              fontWeight: 800
            }}
          >
            Login
          </button>
        </div>
        <Left>
          <H1>Design slides from your content — in minutes</H1>
          <Lead>
            Snippetly transforms long-form text into beautiful shareable slides and social visuals using smart templates and AI-powered summarization.
            Save time, keep your voice, and publish faster.
          </Lead>

          <PolotnoCard>
            <PolotnoTitle>
              🎨 Powered by Polotno
            </PolotnoTitle>
            <PolotnoText>
              Polotno makes it easy to create and customize images and videos – from hands-on design to fully automated workflows.
            </PolotnoText>
            <PolotnoText>
              Start creating banners, ads, reels – any visuals you need – with Polotno Studio. Want it inside your product?
              Use Polotno SDK to embed a white-label editor into your website or web platform.
            </PolotnoText>
            <PolotnoButton href="https://polotno.com/" target="_blank" rel="noopener noreferrer">
              Explore Polotno →
            </PolotnoButton>
          </PolotnoCard>

          {/* Primary CTA removed: single Login header button is the visible action */}

          <FeatureGrid>
            <Feature>
              <strong style={{color:'#0f172a'}}>AI Summaries</strong>
              <div style={{fontSize:12, color:'#334155'}}>Turn long text into concise slides automatically.</div>
            </Feature>
            <Feature>
              <strong style={{color:'#0f172a'}}>Templates</strong>
              <div style={{fontSize:12, color:'#334155'}}>Professionally designed formats for social and presentations.</div>
            </Feature>
            <Feature>
              <strong style={{color:'#0f172a'}}>One-click publish</strong>
              <div style={{fontSize:12, color:'#334155'}}>Export images or share drafts fast.</div>
            </Feature>
            <Feature>
              <strong style={{color:'#0f172a'}}>Customizable</strong>
              <div style={{fontSize:12, color:'#334155'}}>Adjust style, fonts and colors to match your brand.</div>
            </Feature>
          </FeatureGrid>
        </Left>

        <Right>
          <Illustration>
            <h3 style={{ margin: 0, fontSize: 18, color: '#0f172a' }}>What Snippetly does</h3>
            <p style={{ marginTop: 8, color: '#475569', fontSize: 13, lineHeight: 1.5 }}>
              Snippetly converts long-form text into concise, visual slide decks and social-ready images.
              Paste an article, notes or transcript and our AI extracts the key points and maps them onto templates.
            </p>

            <h4 style={{ marginTop: 12, marginBottom: 6, fontSize: 15, color: '#0f172a' }}>How we use Polotno Studio</h4>
            <p style={{ margin: 0, color: '#475569', fontSize: 13, lineHeight: 1.4 }}>
              The editor you see when you open a project is built with Polotno Studio. We use its canvas, page model
              and component library to render slides, load templates and let you fine-tune layout, fonts and colors.
            </p>

            <h4 style={{ marginTop: 12, marginBottom: 6, fontSize: 15, color: '#0f172a' }}>Workflow in a few steps</h4>
            <ol style={{ marginTop: 6, color: '#475569', fontSize: 13, lineHeight: 1.4 }}>
              <li>Paste or import your text and choose an output type.</li>
              <li>AI summarizes and generates slide content.</li>
              <li>Apply templates and open the Polotno editor to refine visuals.</li>
            </ol>

            <p style={{ marginTop: 12, color: '#475569', fontSize: 12 }}>
              You keep full control — exported assets are yours and templates are editable inside the Polotno editor.
            </p>
          </Illustration>
        </Right>
      </Card>
    </Page>
  );
};

export default MainLanding;
