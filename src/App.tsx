import React, { useEffect, useState } from 'react';
import {
  Brain, Code, Calculator, MessageCircle, Monitor,
  ChevronRight, RotateCcw, Award
} from 'lucide-react';

interface RawQuestion {
  category: string;
  question: string;
  options: string[];
  answer: string; // e.g., "B"
}

interface Question {
  id: number;
  question: string;
  options: string[];
  correct: number; // index of the correct answer
  explanation?: string;
}

interface TestCategory {
  id: string;
  name: string;
  icon: React.ReactNode;
  questions: Question[];
}

type AppState = 'welcome' | 'category-selection' | 'testing' | 'results';

function App() {
  const [currentState, setCurrentState] = useState<AppState>('welcome');
  const [selectedCategory, setSelectedCategory] = useState<TestCategory | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<number[]>([]);
  const [showExplanation, setShowExplanation] = useState(false);
  const [score, setScore] = useState(0);
  const [voiceOn, setVoiceOn] = useState(true);
  const [testCategories, setTestCategories] = useState<TestCategory[]>([]);

  useEffect(() => {
    fetch('/questions.json')
      .then(res => res.json())
      .then((data: RawQuestion[]) => {
        const grouped: Record<string, Question[]> = {};

        data.forEach((q, index) => {
          const correctIndex = q.answer.charCodeAt(0) - 'A'.charCodeAt(0); // e.g. "B" → 1
          const formatted: Question = {
            id: index + 1,
            question: q.question,
            options: q.options,
            correct: correctIndex,
          };
          if (!grouped[q.category]) {
            grouped[q.category] = [];
          }
          grouped[q.category].push(formatted);
        });

        const categories: TestCategory[] = Object.entries(grouped).map(([category, questions], idx) => ({
          id: category.toLowerCase().replace(/\s+/g, '-'),
          name: category,
          icon: getIconForCategory(category),
          questions
        }));

        setTestCategories(categories);
      })
      .catch(err => console.error('Failed to load questions.json:', err));
  }, []);

  const getIconForCategory = (category: string) => {
    if (category.toLowerCase().includes('software')) return <Code className="w-6 h-6" />;
    if (category.toLowerCase().includes('computer')) return <Monitor className="w-6 h-6" />;
    if (category.toLowerCase().includes('logical')) return <Brain className="w-6 h-6" />;
    if (category.toLowerCase().includes('quantitative')) return <Calculator className="w-6 h-6" />;
    if (category.toLowerCase().includes('verbal')) return <MessageCircle className="w-6 h-6" />;
    return <Award className="w-6 h-6" />;
  };
  

  const handleStart = () => {
    setCurrentState('category-selection');
  };

  const handleCategorySelect = (category: TestCategory) => {
    setSelectedCategory(category);
    setCurrentState('testing');
    setCurrentQuestionIndex(0);
    setUserAnswers([]);
    setShowExplanation(false);
    setScore(0);
  };

  // VOICE OVER: Speak the question + options
useEffect(() => {
  const current = selectedCategory?.questions[currentQuestionIndex];
  if (!current || !voiceOn) return;

  // Cancel any ongoing speech first
  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(
    `${current.question}. Options are: ${current.options.join(', ')}`
  );

  utterance.rate = 0.9;
  window.speechSynthesis.speak(utterance);
}, [selectedCategory, currentQuestionIndex, voiceOn]);



  const handleAnswer = (answerIndex: number) => {
    window.speechSynthesis.cancel();

    if (showExplanation) return;
    
    const isCorrect = answerIndex === selectedCategory!.questions[currentQuestionIndex].correct;
    const newAnswers = [...userAnswers, answerIndex];
    setUserAnswers(newAnswers);
    
    if (isCorrect) {
      setScore(score + 1);
    }
    
    setShowExplanation(true);
  };

  const handleNext = () => {
    window.speechSynthesis.cancel();

    if (currentQuestionIndex < selectedCategory!.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setShowExplanation(false);
    } else {
      setCurrentState('results');
    }
  };

  const resetTest = () => {
    setCurrentState('welcome');
    setSelectedCategory(null);
    setCurrentQuestionIndex(0);
    setUserAnswers([]);
    setShowExplanation(false);
    setScore(0);
  };

  const getScoreMessage = () => {
    const percentage = (score / selectedCategory!.questions.length) * 100;
    if (percentage >= 80) return "Excellent performance.";
    if (percentage >= 60) return "Good performance.";
    if (percentage >= 40) return "Average performance.";
    return "Needs improvement.";
  };

  if (currentState === 'welcome') {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
        <div className="max-w-2xl mx-auto text-center">
          <div className="mb-8">
            <Brain className="w-16 h-16 mx-auto mb-4 text-white" />
            <h1 className="text-5xl font-bold mb-4 tracking-tight">APTITUDE TEST AI</h1>
            <p className="text-xl text-gray-300 mb-8">Professional Aptitude Test Assistant</p>
          </div>
          
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-8 mb-8">
            <p className="text-gray-200 mb-6 leading-relaxed">
              Sharp. Minimal. Technical. I will guide you through comprehensive aptitude tests 
              across multiple domains. One question at a time. Immediate feedback. Performance analysis.
            </p>
            <p className="text-sm text-gray-400">
              Categories: Software Engineering • Logical Reasoning • Quantitative Aptitude • Verbal Ability • Computer Knowledge
            </p>
          </div>
          
          <button
            onClick={handleStart}
            className="bg-white text-black px-8 py-4 rounded-lg font-semibold hover:bg-gray-100 transition-colors duration-200 flex items-center mx-auto group"
          >
            BEGIN ASSESSMENT
            <ChevronRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform duration-200" />
          </button>
        </div>
      </div>
    );
  }

  if (currentState === 'category-selection') {
    return (
      <div className="min-h-screen bg-black text-white p-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">SELECT TEST CATEGORY</h2>
            <p className="text-gray-400">Choose your assessment domain.</p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {testCategories.map((category) => (
              <button
                key={category.id}
                onClick={() => handleCategorySelect(category)}
                className="bg-gray-900 border border-gray-800 rounded-lg p-6 hover:border-white transition-colors duration-200 text-left group"
              >
                <div className="flex items-center mb-4">
                  <div className="text-white group-hover:scale-110 transition-transform duration-200">
                    {category.icon}
                  </div>
                  <ChevronRight className="w-5 h-5 ml-auto text-gray-600 group-hover:text-white transition-colors duration-200" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{category.name}</h3>
                <p className="text-sm text-gray-400">{category.questions.length} questions</p>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (currentState === 'testing' && selectedCategory) {
    const currentQuestion = selectedCategory.questions[currentQuestionIndex];
    const isCorrect = showExplanation && userAnswers[currentQuestionIndex] === currentQuestion.correct;
    
    return (
      <div className="min-h-screen bg-black text-white p-4">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
 <button
  onClick={() => {
    window.speechSynthesis.cancel();
    setVoiceOn(prev => !prev);
  }}
  className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-300 border ${
    voiceOn
      ? 'bg-white text-black hover:bg-gray-200 border-white shadow-lg'
      : 'bg-transparent text-white hover:bg-gray-800 border-gray-600'
  }`}
>
  <span className="text-xl">{voiceOn ? '🔊' : '🔇'}</span>
  <span className="font-medium">{voiceOn ? 'Voice On' : 'Voice Off'}</span>
</button>


              <h2 className="text-xl font-semibold">{selectedCategory.name}</h2>
              <p className="text-gray-400">Question {currentQuestionIndex + 1} of {selectedCategory.questions.length}</p>
            </div>
            <div className="text-right">
              <p className="text-gray-400">Score</p>
              <p className="text-2xl font-bold">{score}/{selectedCategory.questions.length}</p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-gray-800 rounded-full h-2 mb-8">
            <div 
              className="bg-white h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentQuestionIndex + 1) / selectedCategory.questions.length) * 100}%` }}
            ></div>
          </div>

          {/* Question */}
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-8 mb-8">
            <h3 className="text-xl font-medium mb-6 leading-relaxed">{currentQuestion.question}</h3>
            
            <div className="space-y-3">
              {currentQuestion.options.map((option, index) => {
                let buttonClass = "w-full text-left p-4 rounded-lg border transition-all duration-200 ";
                
                if (!showExplanation) {
                  buttonClass += "border-gray-700 bg-gray-800 hover:border-gray-600 hover:bg-gray-750";
                } else {
                  if (index === currentQuestion.correct) {
                    buttonClass += "border-green-500 bg-green-900/20 text-green-400";
                  } else if (index === userAnswers[currentQuestionIndex]) {
                    buttonClass += "border-red-500 bg-red-900/20 text-red-400";
                  } else {
                    buttonClass += "border-gray-700 bg-gray-800 text-gray-500";
                  }
                }

                return (
                  <button
                    key={index}
                    onClick={() => handleAnswer(index)}
                    disabled={showExplanation}
                    className={buttonClass}
                  >
                    {option}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Explanation */}
          {showExplanation && (
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 mb-8">
              <div className="flex items-center mb-3">
                <div className={`w-3 h-3 rounded-full mr-3 ${isCorrect ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span className="font-semibold">{isCorrect ? 'CORRECT' : 'INCORRECT'}</span>
              </div>
              <p className="text-gray-300">{currentQuestion.explanation}</p>
            </div>
          )}

          {/* Next Button */}
          {showExplanation && (
            <div className="text-center">
              <button
                onClick={handleNext}
                className="bg-white text-black px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors duration-200"
              >
                {currentQuestionIndex < selectedCategory.questions.length - 1 ? 'NEXT QUESTION' : 'VIEW RESULTS'}
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (currentState === 'results' && selectedCategory) {
    const percentage = Math.round((score / selectedCategory.questions.length) * 100);
    
    return (
      <div className="min-h-screen bg-black text-white p-4">
        <div className="max-w-2xl mx-auto text-center">
          <div className="mb-8">
            <Award className="w-16 h-16 mx-auto mb-4 text-white" />
            <h2 className="text-3xl font-bold mb-4">ASSESSMENT COMPLETE</h2>
            <p className="text-gray-400">{selectedCategory.name}</p>
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-lg p-8 mb-8">
            <div className="grid md:grid-cols-3 gap-6 mb-6">
              <div>
                <p className="text-gray-400 mb-2">Score</p>
                <p className="text-3xl font-bold">{score}/{selectedCategory.questions.length}</p>
              </div>
              <div>
                <p className="text-gray-400 mb-2">Accuracy</p>
                <p className="text-3xl font-bold">{percentage}%</p>
              </div>
              <div>
                <p className="text-gray-400 mb-2">Questions</p>
                <p className="text-3xl font-bold">{selectedCategory.questions.length}</p>
              </div>
            </div>
            
            <div className="text-center">
              <p className="text-lg font-semibold mb-2">{getScoreMessage()}</p>
              <p className="text-gray-400">Performance analysis complete.</p>
            </div>
          </div>

          <button
            onClick={resetTest}
            className="bg-white text-black px-8 py-4 rounded-lg font-semibold hover:bg-gray-100 transition-colors duration-200 flex items-center mx-auto group"
          >
            <RotateCcw className="w-5 h-5 mr-2 group-hover:rotate-180 transition-transform duration-300" />
            NEW ASSESSMENT
          </button>
        </div>
      </div>
    );
  }

  return null;
}

export default App;