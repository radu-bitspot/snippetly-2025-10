import React, { useState, useEffect } from 'react';
import styled from 'polotno/utils/styled';
import * as api from '../api';

const LandingContainer = styled('div')`
  min-height: 100vh;
  background: #f5f5f5;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  font-family: 'Courier Prime', 'Courier New', monospace;
`;

const ContentCard = styled('div')`
  position: relative;
  padding: 60px 40px;
  max-width: 900px;
  width: 100%;
  background: #ffffff;
  border-radius: 20px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
  border: 2px solid #000000;
  text-align: center;
`;

const Title = styled('h1')`
  color: #000000;
  font-size: 48px;
  font-weight: 700;
  margin: 0 0 16px 0;
  letter-spacing: -1px;
`;

const Subtitle = styled('p')`
  color: #4a4a4a;
  font-size: 20px;
  margin: 0 0 48px 0;
  font-weight: 400;
`;

const OptionsGrid = styled('div')`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 40px;
`;

const OptionCard = styled('div')`
  background: ${props => props.selected ? '#000000' : '#f7f7f7'};
  border: 3px solid ${props => props.selected ? '#000000' : '#cccccc'};
  border-radius: 16px;
  padding: 24px 16px;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 24px rgba(0, 0, 0, 0.2);
    border-color: #000000;
  }
`;

const OptionIcon = styled('div')`
  font-size: 48px;
  margin-bottom: 12px;
`;

const OptionTitle = styled('h3')`
  color: ${props => props.selected ? '#ffffff' : '#000000'};
  font-size: 18px;
  font-weight: 600;
  margin: 0 0 8px 0;
`;

const OptionDescription = styled('p')`
  color: ${props => props.selected ? '#e0e0e0' : '#5a5a5a'};
  font-size: 14px;
  margin: 0;
  line-height: 1.5;
`;

const ActionButtons = styled('div')`
  display: flex;
  gap: 16px;
  justify-content: center;
  margin-top: 32px;
`;

const PrimaryButton = styled('button')`
  padding: 16px 48px;
  font-size: 18px;
  font-weight: 600;
  border-radius: 12px;
  background: #000000;
  color: #ffffff;
  border: 2px solid #000000;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
    background: #2a2a2a;
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    background: #666666;
  }
`;

const SecondaryButton = styled('button')`
  padding: 16px 48px;
  font-size: 18px;
  font-weight: 600;
  border-radius: 12px;
  background: transparent;
  color: #000000;
  border: 2px solid #000000;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover:not(:disabled) {
    background: rgba(0, 0, 0, 0.1);
    transform: translateY(-2px);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const WEBHOOK_URL = 'http://79.137.67.72:5678/webhook/4ae9444d-23e0-4743-a197-1bc1e423df8f';

const PAGE_FORMATS = [
  { id: 'facebook', name: 'Facebook Post', width: 1200, height: 630 },
  { id: 'instagram', name: 'Instagram Post', width: 1080, height: 1080 },
  { id: 'instagram-story', name: 'Instagram Story', width: 1080, height: 1920 },
  { id: 'tiktok', name: 'TikTok', width: 1080, height: 1920 },
  { id: 'twitter', name: 'Twitter Post', width: 1200, height: 675 },
  { id: 'linkedin', name: 'LinkedIn Post', width: 1200, height: 627 },
  { id: 'presentation', name: 'Presentation', width: 1920, height: 1080 },
];

const LandingPage = ({ onStart }) => {
  // Summarize state
  const [inputText, setInputText] = useState('');
  const [summaryTitle, setSummaryTitle] = useState('');
  const [outputType, setOutputType] = useState('story-teaser');
  const [summarizeLoading, setSummarizeLoading] = useState(false);
  
  // Configuration state (after AI response)
  const [aiResponse, setAiResponse] = useState(null);
  const [showConfig, setShowConfig] = useState(false);
  const [numSlides, setNumSlides] = useState(5);
  const [selectedFormat, setSelectedFormat] = useState('presentation');
  const [projectName, setProjectName] = useState('');
  
  // My Designs state
  const [designs, setDesigns] = useState([]);
  const [selectedDesign, setSelectedDesign] = useState(null);
  const [useBlank, setUseBlank] = useState(true); // explicitly track blank vs existing design
  const [designsLoading, setDesignsLoading] = useState(false);

  // Load designs on mount
  useEffect(() => {
    const loadDesigns = async () => {
      setDesignsLoading(true);
      try {
        const result = await api.listDesigns();
        if (Array.isArray(result)) {
          setDesigns(result);
          console.log('📋 Loaded designs for templates:', result.length);
        }
      } catch (error) {
        console.error('Error loading designs:', error);
      } finally {
        setDesignsLoading(false);
      }
    };
    
    loadDesigns();
  }, []);

  const handleSummarize = async () => {
    if (!inputText.trim() || inputText.length < 20) {
      alert('Te rog introdu cel puțin 20 de caractere');
      return;
    }
    
    if (!summaryTitle.trim()) {
      alert('Te rog introdu un titlu pentru sumarizare');
      return;
    }

    setSummarizeLoading(true);
    
    try {
      const userId = localStorage.getItem('userId') || 'anonymous';
      
      const response = await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'summarize',
          title: summaryTitle.trim(),
          summarization_title: summaryTitle.trim(), // Send as summarization_title too
          text: inputText,
          outputType: outputType,
          tone: 'ACCESIBIL-EDUCAȚIONAL',
          owner_id: userId
        })
      });

      if (response.ok) {
        const data = await response.json();

        console.log('🤖 AI Response received:', data);
        console.log('🤖 Data structure:', JSON.stringify(data, null, 2));

        // Save AI response and show configuration screen
        setAiResponse(data);

        // Set project name from Summary Title
        setProjectName(summaryTitle.trim());

        setShowConfig(true);
      } else {
        alert('Failed to generate summary. Please try again.');
      }
    } catch (error) {
      console.error('Summarize error:', error);
      alert('Failed to generate summary. Please try again.');
    } finally {
      setSummarizeLoading(false);
    }
  };

  const handleCreateProject = async () => {
    if (!aiResponse) return;
    
    if (!projectName.trim()) {
      alert('Te rog introdu un nume pentru proiect');
      return;
    }

    const format = PAGE_FORMATS.find(f => f.id === selectedFormat);

    // Add format name to project title
    const formatName = format ? format.name : '';
    const finalProjectName = formatName
      ? `${projectName.trim()} - ${formatName}`
      : projectName.trim();

    // Extract content from various possible webhook response structures
    let slideContent = [];
    if (aiResponse.slides && Array.isArray(aiResponse.slides)) {
      slideContent = aiResponse.slides;
    } else if (aiResponse.result?.slides && Array.isArray(aiResponse.result.slides)) {
      slideContent = aiResponse.result.slides;
    } else if (aiResponse.data?.slides && Array.isArray(aiResponse.data.slides)) {
      slideContent = aiResponse.data.slides;
    } else if (Array.isArray(aiResponse)) {
      slideContent = aiResponse;
    }

    console.log('📋 Extracted slide content:', slideContent);
    console.log('📋 Number of slides from AI:', slideContent.length);

    // Create template with configuration
    // Always include AI content if available
    const template = useBlank
      ? {
          id: 'ai-generated-blank',
          title: finalProjectName || 'New Design',
          description: 'AI-generated content on blank slides',
          slides: numSlides,
          content: slideContent, // Include AI content for blank template too
          format: format,
          outputType: outputType,
          selectedDesign: null,
        }
      : {
          id: 'ai-generated',
          title: finalProjectName,
          description: 'Created from AI-generated content',
          slides: selectedDesign ? null : numSlides, // If design selected, use its pages
          content: slideContent,
          format: selectedDesign ? null : format, // If design selected, keep its format
          outputType: outputType, // Pass output type for tagging
          selectedDesign: selectedDesign, // Pass the selected design to load
        };

    console.log('📋 Creating project with template:', template);
    console.log('📋 AI Response:', aiResponse);
    console.log('📋 Selected Design:', selectedDesign);
    
    // Pass to parent to create the project
    await onStart(template);
  };

  const handleSkipToEditor = () => {
    console.log('🚀 Skip to Editor clicked!');
    // Create a minimal blank template to go straight to editor
    const blankTemplate = {
      id: 'blank',
      title: 'New Design',
      description: 'Blank design',
      slides: 1,
      content: [],
      format: null
    };
    console.log('🚀 Calling onStart with blank template:', blankTemplate);
    onStart(blankTemplate);
  };

  const outputTypes = [
    { id: 'story-teaser', name: '📖 Story Teaser' },
    { id: 'key-points-carousel', name: '🔑 Key Points' },
    { id: 'did-you-know', name: '💡 Did You Know' },
    { id: 'timeline', name: '⏱️ Timeline' },
    { id: 'single-page', name: '📄 Single Page' }
  ];

  return (
    <LandingContainer>
      <ContentCard>
        {/* Skip to Editor Button - Fixed position - KEEP COLORED */}
        <button
          onClick={handleSkipToEditor}
          style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            zIndex: 10,
            padding: '12px 24px',
            fontSize: '14px',
            fontWeight: '600',
            borderRadius: '8px',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: '#ffffff',
            border: 'none',
            cursor: 'pointer',
            transition: 'all 0.3s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 8px 25px rgba(102, 126, 234, 0.4)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          Skip to Editor →
        </button>

        {/* Configuration Screen - After AI Response */}
        {showConfig && aiResponse ? (
          <>
            <Title>Your AI-Generated Content is Ready!</Title>
            <Subtitle>Preview slides and configure your presentation</Subtitle>

            {/* AI Generated Slides Preview */}
            <div style={{
              marginBottom: '32px',
              maxHeight: '300px',
              overflowY: 'auto',
              border: '2px solid #e0e0e0',
              borderRadius: '12px',
              padding: '16px',
              background: '#fafafa'
            }}>
              <div style={{
                fontSize: '14px',
                fontWeight: '600',
                marginBottom: '16px',
                color: '#000000',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <span>🎯 Generated Slides</span>
                <span style={{
                  fontSize: '12px',
                  fontWeight: '400',
                  color: '#666',
                  background: '#000',
                  color: '#fff',
                  padding: '2px 8px',
                  borderRadius: '12px'
                }}>
                  {aiResponse?.slides?.length || 0} slides
                </span>
              </div>

              {aiResponse?.slides && aiResponse.slides.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {aiResponse.slides.map((slide, index) => {
                    const content = slide.variations?.[0]?.content || slide.content || 'No content';
                    return (
                      <div
                        key={index}
                        style={{
                          background: '#ffffff',
                          border: '1px solid #e0e0e0',
                          borderRadius: '8px',
                          padding: '12px',
                          transition: 'all 0.3s ease',
                          cursor: 'default'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.borderColor = '#000000'}
                        onMouseLeave={(e) => e.currentTarget.style.borderColor = '#e0e0e0'}
                      >
                        <div style={{
                          fontSize: '12px',
                          fontWeight: '600',
                          marginBottom: '8px',
                          color: '#000000',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px'
                        }}>
                          <span style={{
                            background: '#000000',
                            color: '#ffffff',
                            padding: '2px 8px',
                            borderRadius: '4px',
                            fontSize: '11px'
                          }}>
                            Slide {index + 1}
                          </span>
                          {slide.slideType && (
                            <span style={{ fontSize: '11px', color: '#666' }}>
                              {slide.slideType}
                            </span>
                          )}
                        </div>
                        <div style={{
                          fontSize: '13px',
                          lineHeight: '1.5',
                          color: '#333',
                          maxHeight: '60px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          display: '-webkit-box',
                          WebkitLineClamp: 3,
                          WebkitBoxOrient: 'vertical'
                        }}>
                          {content.substring(0, 150)}{content.length > 150 ? '...' : ''}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '20px', color: '#999' }}>
                  No slides generated
                </div>
              )}
            </div>

            {/* Project Name */}
            <div style={{ marginBottom: '24px', textAlign: 'left' }}>
              <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '8px', color: '#000000' }}>
                Project Name:
              </div>
              <input
                type="text"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="Enter project name..."
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  fontSize: '16px',
                  borderRadius: '8px',
                  border: '2px solid #cccccc',
                  fontFamily: 'inherit',
                  outline: 'none',
                  transition: 'border-color 0.3s ease',
                  backgroundColor: '#ffffff',
                  color: '#000000'
                }}
                onFocus={(e) => e.target.style.borderColor = '#000000'}
                onBlur={(e) => e.target.style.borderColor = '#cccccc'}
              />
            </div>

            {/* Choose Template (My Designs or Blank) */}
            <div style={{ marginBottom: '24px', textAlign: 'left' }}>
              <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '8px', color: '#000000' }}>
                Choose Template:
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '10px', marginBottom: '12px' }}>
                {/* Blank option */}
                <div
                  onClick={() => { setSelectedDesign(null); setUseBlank(true); }}
                  style={{
                    padding: '10px',
                    borderRadius: '10px',
                    border: selectedDesign === null ? '3px solid #000000' : '2px solid #cccccc',
                    background: selectedDesign === null ? '#000000' : '#ffffff',
                    color: selectedDesign === null ? '#ffffff' : '#000000',
                    cursor: 'pointer',
                    textAlign: 'center',
                    fontWeight: '600',
                    minHeight: '80px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.3s ease',
                    fontSize: '12px'
                  }}
                >
                  <div>
                    <div style={{ fontSize: '28px', marginBottom: '6px' }}>📄</div>
                    <div>New Blank</div>
                  </div>
                </div>

                {/* Existing designs */}
                {designs.slice(0, 5).map(design => (
                  <div
                    key={design.id}
                    onClick={() => { setSelectedDesign(design); setUseBlank(false); }}
                    style={{
                      padding: '4px',
                      borderRadius: '10px',
                      border: selectedDesign?.id === design.id ? '3px solid #000000' : '2px solid #cccccc',
                      background: '#ffffff',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      overflow: 'hidden'
                    }}
                  >
                    <div style={{
                      width: '100%',
                      height: '70px',
                      background: '#f5f5f5',
                      borderRadius: '6px',
                      overflow: 'hidden',
                      marginBottom: '4px'
                    }}>
                      <div style={{
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '24px'
                      }}>
                        🎨
                      </div>
                    </div>
                    <div style={{
                      fontSize: '10px',
                      fontWeight: '600',
                      color: '#000000',
                      textAlign: 'center',
                      padding: '4px',
                      lineHeight: '1.2',
                      wordBreak: 'break-word',
                      minHeight: '30px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      {design.name.substring(0, 20)}{design.name.length > 20 ? '...' : ''}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Number of Slides - Only if using blank */}
            {!selectedDesign && (
              <div style={{ marginBottom: '24px', textAlign: 'left' }}>
                <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '8px', color: '#000000' }}>
                  Number of Slides: <span style={{ color: '#000000' }}>{numSlides}</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={numSlides}
                  onChange={(e) => setNumSlides(parseInt(e.target.value))}
                  style={{ width: '100%', accentColor: '#000000' }}
                />
              </div>
            )}

            {/* Format Selection */}
            <div style={{ marginBottom: '24px', textAlign: 'left' }}>
              <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '8px', color: '#000000' }}>
                Choose Format:
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '8px' }}>
                {PAGE_FORMATS.map(format => (
                  <div
                    key={format.id}
                    onClick={() => setSelectedFormat(format.id)}
                    style={{
                      padding: '12px',
                      borderRadius: '8px',
                      border: selectedFormat === format.id ? '3px solid #000000' : '2px solid #cccccc',
                      background: selectedFormat === format.id ? '#000000' : '#ffffff',
                      color: selectedFormat === format.id ? '#ffffff' : '#000000',
                      cursor: 'pointer',
                      textAlign: 'center',
                      fontWeight: '600',
                      transition: 'all 0.3s ease',
                      fontSize: '13px'
                    }}
                  >
                    {format.name}
                    <div style={{ fontSize: '10px', opacity: 0.8, marginTop: '4px' }}>
                      {format.width} × {format.height}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '12px' }}>
              <SecondaryButton
                onClick={() => { setShowConfig(false); setAiResponse(null); }}
                style={{ flex: 1 }}
              >
                ← Back
              </SecondaryButton>
              <PrimaryButton
                onClick={handleCreateProject}
                style={{ flex: 2 }}
              >
                🚀 Create & Fill All Slides
              </PrimaryButton>
            </div>
          </>
        ) : (
          <>
            <Title>AI Presentation Generator</Title>
            <Subtitle>Paste your content and let AI create stunning slides</Subtitle>

            {/* Title Input */}
            <div style={{ marginBottom: '16px', textAlign: 'left' }}>
              <div style={{
                fontSize: '14px',
                fontWeight: '600',
                marginBottom: '8px',
                color: '#000000'
              }}>
                Summary Title: <span style={{ color: '#666666' }}>*</span>
              </div>
              <input
                type="text"
                value={summaryTitle}
                onChange={(e) => {
                  console.log('Title input changed:', e.target.value);
                  setSummaryTitle(e.target.value);
                }}
                onInput={(e) => console.log('Title input event:', e.target.value)}
                onClick={() => console.log('Title input clicked')}
                placeholder="Enter a title for your summary..."
                autoComplete="off"
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  fontSize: '16px',
                  borderRadius: '8px',
                  border: '2px solid #cccccc',
                  fontFamily: 'inherit',
                  outline: 'none',
                  transition: 'border-color 0.3s ease',
                  position: 'relative',
                  zIndex: 1,
                  pointerEvents: 'auto',
                  backgroundColor: '#ffffff',
                  boxSizing: 'border-box',
                  color: '#000000'
                }}
                onFocus={(e) => {
                  console.log('Title input focused');
                  e.target.style.borderColor = '#000000';
                }}
                onBlur={(e) => e.target.style.borderColor = '#cccccc'}
              />
            </div>

            {/* Text Input */}
            <div style={{ marginBottom: '16px', textAlign: 'left' }}>
              <div style={{
                fontSize: '14px',
                fontWeight: '600',
                marginBottom: '8px',
                color: '#000000'
              }}>
                Content to Summarize: <span style={{ color: '#666666' }}>*</span>
              </div>
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Paste your text here (min 20 characters)..."
                style={{
                  width: '100%',
                  minHeight: '200px',
                  padding: '16px',
                  fontSize: '16px',
                  borderRadius: '12px',
                  border: '2px solid #cccccc',
                  resize: 'vertical',
                  fontFamily: 'inherit',
                  outline: 'none',
                  transition: 'border-color 0.3s ease',
                  position: 'relative',
                  zIndex: 1,
                  pointerEvents: 'auto',
                  backgroundColor: '#ffffff',
                  color: '#000000',
                  boxSizing: 'border-box'
                }}
                onFocus={(e) => e.target.style.borderColor = '#000000'}
                onBlur={(e) => e.target.style.borderColor = '#cccccc'}
              />
            </div>

            <div style={{
              marginBottom: '16px',
              textAlign: 'left'
            }}>
              <div style={{
                fontSize: '14px',
                fontWeight: '600',
                marginBottom: '8px',
                color: '#000000'
              }}>
                Output Type:
              </div>
              <div style={{
                display: 'flex',
                gap: '8px',
                flexWrap: 'wrap'
              }}>
                {outputTypes.map(type => (
                  <SecondaryButton
                    key={type.id}
                    onClick={() => setOutputType(type.id)}
                    style={{
                      padding: '12px 24px',
                      background: outputType === type.id
                        ? '#000000'
                        : 'transparent',
                      color: outputType === type.id ? '#ffffff' : '#000000',
                      border: outputType === type.id ? '2px solid #000000' : '2px solid #000000'
                    }}
                  >
                    {type.name}
                  </SecondaryButton>
                ))}
              </div>
            </div>

            <div style={{
              fontSize: '12px',
              color: '#666666',
              marginBottom: '16px',
              textAlign: 'right'
            }}>
              {inputText.length} characters
            </div>

            <PrimaryButton
              onClick={handleSummarize}
              disabled={inputText.length < 20 || !summaryTitle.trim() || summarizeLoading}
              style={{ width: '100%' }}
            >
              {summarizeLoading ? '⏳ Generating with AI...' : '🚀 Generate Content'}
            </PrimaryButton>
            
            {(!summaryTitle.trim() || inputText.length < 20) && (
              <div style={{
                marginTop: '12px',
                fontSize: '12px',
                color: '#666666',
                textAlign: 'center'
              }}>
                {!summaryTitle.trim() && '⚠️ Title is required. '}
                {inputText.length < 20 && `⚠️ Need ${20 - inputText.length} more characters.`}
              </div>
            )}
          </>
        )}
      </ContentCard>
    </LandingContainer>
  );
};

export default LandingPage;

