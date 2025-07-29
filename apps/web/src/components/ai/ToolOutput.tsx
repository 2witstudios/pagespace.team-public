import React from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '../ui/accordion';
import { Editor } from '@monaco-editor/react';

interface ToolOutputProps {
  xml: string;
}

const ToolOutput: React.FC<ToolOutputProps> = ({ xml }) => {
  return (
    <Accordion type="single" collapsible className="w-full">
      <AccordionItem value="item-1">
        <AccordionTrigger>View Tool Call</AccordionTrigger>
        <AccordionContent>
          <div className="h-64 w-full">
            <Editor
              height="100%"
              language="xml"
              value={xml}
              options={{
                readOnly: true,
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                lineNumbers: 'off',
              }}
            />
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
};

export default ToolOutput;