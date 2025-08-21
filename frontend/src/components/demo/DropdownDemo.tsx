"use client";

import { Button } from "../ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "../ui/dropdown-menu";
import { ChevronDown, Sparkles, Code, Palette } from "lucide-react";
import { useState } from "react";

function DropdownDemo() {
  const [framework, setFramework] = useState("nextjs");

  const frameworks = {
    frontend: [
      { value: "nextjs", label: "Next.js", description: "The React framework for production" },
      { value: "react", label: "React", description: "A JavaScript library for building user interfaces" },
      { value: "vue", label: "Vue.js", description: "The progressive JavaScript framework" },
      { value: "svelte", label: "Svelte", description: "Cybernetically enhanced web apps" },
    ],
    backend: [
      { value: "nodejs", label: "Node.js", description: "JavaScript runtime built on Chrome's V8" },
      { value: "python", label: "Python", description: "High-level programming language" },
      { value: "go", label: "Go", description: "Open source programming language by Google" },
      { value: "rust", label: "Rust", description: "Systems programming language focused on safety" },
    ]
  };

  return (
    <div className="p-8 space-y-8 max-w-4xl mx-auto">
      {/* Header Section */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center px-4 py-2 rounded-full bg-gradient-to-r from-sih-orange/10 to-sih-blue/10 border border-sih-orange/20 mb-4">
          <Sparkles className="h-4 w-4 text-sih-blue mr-2" />
          <span className="text-sm font-medium text-sih-blue">Interactive Components</span>
        </div>
        
        <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-sih-orange via-sih-blue to-sih-orange bg-clip-text text-transparent">
          Modern Dropdown Menu
        </h1>
        
        <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
          Experience our beautifully crafted dropdown components with smooth animations, 
          grouped options, and SIH-themed styling.
        </p>
      </div>

      {/* Demo Grid */}
      <div className="grid md:grid-cols-2 gap-8">
        {/* Basic Dropdown */}
        <div className="space-y-4 p-6 rounded-xl bg-gradient-to-br from-gray-50 to-white border border-gray-200/60 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Code className="h-5 w-5 text-sih-blue" />
            <h3 className="text-xl font-semibold text-gray-900">Framework Selection</h3>
          </div>
          
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">
              Choose Development Stack
            </label>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="outline" 
                  className="w-full justify-between h-11 hover:border-sih-blue/40 hover:bg-gradient-to-r hover:from-sih-blue/5 hover:to-sih-orange/5 transition-all duration-200"
                >
                  <span className="font-medium">
                    {frameworks.frontend.find(f => f.value === framework)?.label || 
                     frameworks.backend.find(f => f.value === framework)?.label || "Select Framework"}
                  </span>
                  <ChevronDown className="h-4 w-4 opacity-60" />
                </Button>
              </DropdownMenuTrigger>
              
              <DropdownMenuContent className="w-80">
                <DropdownMenuRadioGroup value={framework} onValueChange={setFramework}>
                  <DropdownMenuLabel>Frontend Frameworks</DropdownMenuLabel>
                  {frameworks.frontend.map((item) => (
                    <DropdownMenuRadioItem 
                      key={item.value} 
                      value={item.value}
                      className="flex-col items-start py-3"
                    >
                      <div className="font-medium text-gray-900">{item.label}</div>
                      <div className="text-xs text-gray-500 mt-0.5">{item.description}</div>
                    </DropdownMenuRadioItem>
                  ))}
                  
                  <DropdownMenuSeparator />
                  
                  <DropdownMenuLabel>Backend Technologies</DropdownMenuLabel>
                  {frameworks.backend.map((item) => (
                    <DropdownMenuRadioItem 
                      key={item.value} 
                      value={item.value}
                      className="flex-col items-start py-3"
                    >
                      <div className="font-medium text-gray-900">{item.label}</div>
                      <div className="text-xs text-gray-500 mt-0.5">{item.description}</div>
                    </DropdownMenuRadioItem>
                  ))}
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>
            
            <div className="mt-4 p-3 bg-sih-blue/5 rounded-lg border border-sih-blue/20">
              <p className="text-sm text-gray-700">
                <span className="font-medium">Selected:</span> {' '}
                <code className="bg-white px-2 py-0.5 rounded text-sih-blue font-medium">
                  {framework}
                </code>
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {frameworks.frontend.find(f => f.value === framework)?.description || 
                 frameworks.backend.find(f => f.value === framework)?.description}
              </p>
            </div>
          </div>
        </div>

        {/* Advanced Features Preview */}
        <div className="space-y-4 p-6 rounded-xl bg-gradient-to-br from-sih-blue/5 to-sih-orange/5 border border-sih-blue/20 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Palette className="h-5 w-5 text-sih-orange" />
            <h3 className="text-xl font-semibold text-gray-900">Enhanced Features</h3>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-white/60 rounded-lg border">
              <span className="text-sm font-medium text-gray-700">Smooth Animations</span>
              <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
            </div>
            
            <div className="flex items-center justify-between p-3 bg-white/60 rounded-lg border">
              <span className="text-sm font-medium text-gray-700">SIH Theme Integration</span>
              <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
            </div>
            
            <div className="flex items-center justify-between p-3 bg-white/60 rounded-lg border">
              <span className="text-sm font-medium text-gray-700">Grouped Options</span>
              <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
            </div>
            
            <div className="flex items-center justify-between p-3 bg-white/60 rounded-lg border">
              <span className="text-sm font-medium text-gray-700">Accessibility Ready</span>
              <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
            </div>

            <div className="mt-6 p-4 bg-gradient-to-r from-sih-orange/10 to-sih-blue/10 rounded-lg border border-sih-orange/20">
              <h4 className="font-semibold text-gray-900 mb-2">Perfect for SIH Projects</h4>
              <p className="text-sm text-gray-600 leading-relaxed">
                Our dropdown components are specifically designed for Smart India Hackathon projects, 
                featuring modern aesthetics and seamless user experience.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export { DropdownDemo };
