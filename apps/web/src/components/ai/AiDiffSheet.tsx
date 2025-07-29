import React from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '../ui/sheet';
import { Button } from '../ui/button';
import { DiffEditor } from '@monaco-editor/react';

interface AiDiffSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onAccept: () => void;
  originalContent: string;
  newContent: string;
  isApproximateMatch: boolean;
}

const AiDiffSheet: React.FC<AiDiffSheetProps> = ({
  isOpen,
  onClose,
  onAccept,
  originalContent,
  newContent,
  isApproximateMatch,
}) => {
  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="left" className="w-3/4 p-0">
        <div className="flex flex-col h-full">
          <SheetHeader className="p-6">
            <SheetTitle>AI-Suggested Changes</SheetTitle>
            <SheetDescription>
              {isApproximateMatch
                ? 'This is an approximate match. Please review carefully before accepting.'
                : 'Review the AI-suggested changes below.'}
            </SheetDescription>
          </SheetHeader>
          <div className="flex-1 min-h-0">
            {isOpen && (
              <DiffEditor
                original={originalContent}
                modified={newContent}
                language="html"
                height="100%"
                options={{ readOnly: true, renderSideBySide: true }}
              />
            )}
          </div>
          <SheetFooter className="p-6 bg-background border-t">
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={onAccept}>Accept Changes</Button>
          </SheetFooter>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default AiDiffSheet;