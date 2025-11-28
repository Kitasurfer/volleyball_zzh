import React from 'react';

interface TrainingPhilosophyProps {
  title: string;
  text: string;
  principles: string[];
}

export const TrainingPhilosophy: React.FC<TrainingPhilosophyProps> = ({ title, text, principles }) => (
  <div className="max-w-4xl mx-auto">
    <div className="bg-white p-8 rounded-lg shadow-sm mb-8">
      <h2 className="text-h3 font-semibold text-primary-900 mb-4">{title}</h2>
      <p className="text-body text-neutral-700 leading-relaxed mb-6">{text}</p>
      <ul className="space-y-3">
        {principles.map((principle, idx) => (
          <li key={idx} className="flex items-start space-x-3">
            <div className="w-2 h-2 bg-accent-500 rounded-full mt-2 flex-shrink-0" />
            <span className="text-body text-neutral-700">{principle}</span>
          </li>
        ))}
      </ul>
    </div>
  </div>
);
