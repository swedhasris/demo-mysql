const fs = require('fs');
let code = fs.readFileSync('src/pages/TicketDetail.tsx', 'utf8');

// 1. Add imports
code = code.replace(
  'import { captureScreenshot, analyzeWorkContext, saveWorkSession, type WorkAnalysis } from "../lib/workSessionAI";',
  'import { captureScreenshot, analyzeWorkContext, saveWorkSession, type WorkAnalysis } from "../lib/workSessionAI";\nimport { ActivityTimeline } from "../components/ActivityTimeline";\nimport { motion, AnimatePresence } from "framer-motion";\nimport { AlertCircle } from "lucide-react";'
);

// Add AlertCircle to lucide-react import
code = code.replace('Eye } from "lucide-react";', 'Eye, AlertCircle } from "lucide-react";');

// 2. Add state
code = code.replace(
  '  const visibleCategories = categories.filter((item) => item.status === \'active\');',
  '  const [timelineRefresh, setTimelineRefresh] = useState(0);\n  const [isPosting, setIsPosting] = useState(false);\n  const [message, setMessage] = useState<{ text: string, type: \'success\' | \'error\' } | null>(null);\n\n  const visibleCategories = categories.filter((item) => item.status === \'active\');'
);

// 3. Update handleAddComment
const addCommentOld = `  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !id || !user) return;
    try {
      const now = new Date().toISOString();
      const historyEntry = { action: "Comment Added", timestamp: now, user: profile?.name || user.email };
      const updates: any = {
        updatedAt: serverTimestamp(),
        history: [...(ticket.history || []), historyEntry]
      };
      if (!ticket.firstResponseAt) {
        updates.firstResponseAt = now;
        updates.responseSlaStatus = "Completed";
      }
      await addDoc(collection(db, "tickets", id, "comments"), {
        userId: user.uid,
        userName: profile?.name || user.email,
        message: newComment,
        type: "comment",
        createdAt: serverTimestamp()
      });
      await updateDoc(doc(db, "tickets", id), updates);
      setNewComment("");
    } catch (error) { console.error(error); }
  };`;

const addCommentNew = `  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !id || !user) return;
    setIsPosting(true);
    try {
      const now = new Date().toISOString();
      const historyEntry = { action: "Comment Added", timestamp: now, user: profile?.name || user.email };
      const updates: any = {
        updatedAt: serverTimestamp(),
        history: [...(ticket.history || []), historyEntry]
      };
      if (!ticket.firstResponseAt) {
        updates.firstResponseAt = now;
        updates.responseSlaStatus = "Completed";
      }
      const res = await fetch(\`/api/tickets/\${id}/activities\`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          activity_type: 'comment',
          visibility_type: 'public',
          created_by: user.uid,
          created_by_name: profile?.name || user.email,
          message: newComment
        })
      });
      if (!res.ok) throw new Error("Failed to post comment to database");
      await updateDoc(doc(db, "tickets", id), updates);
      setNewComment("");
      setTimelineRefresh(prev => prev + 1);
      setMessage({ text: 'Comment posted successfully', type: 'success' });
    } catch (error: any) { 
      console.error(error);
      setMessage({ text: error.message || 'Failed to post comment', type: 'error' });
    } finally {
      setIsPosting(false);
      setTimeout(() => setMessage(null), 4000);
    }
  };`;

code = code.replace(addCommentOld, addCommentNew);

// 4. Update handleAddWorkNote
const addWorkNoteOld = `  const handleAddWorkNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workNote.trim() || !id || !user) return;
    try {
      const historyEntry = { action: "Work Note Added", timestamp: new Date().toISOString(), user: profile?.name || user.email };
      const now = new Date().toISOString();
      const updates: any = {
        updatedAt: serverTimestamp(),
        history: [...(ticket.history || []), historyEntry]
      };
      
      if (!ticket.firstResponseAt) {
        updates.firstResponseAt = now;
        updates.responseSlaStatus = "Completed";
      }

      await addDoc(collection(db, "tickets", id, "comments"), {
        userId: user.uid,
        userName: profile?.name || user.email,
        message: workNote,
        type: "work_note",
        createdAt: serverTimestamp()
      });
      await updateDoc(doc(db, "tickets", id), updates);
      setWorkNote("");
    } catch (error) { console.error(error); }
  };`;

const addWorkNoteNew = `  const handleAddWorkNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workNote.trim() || !id || !user) return;
    setIsPosting(true);
    try {
      const historyEntry = { action: "Work Note Added", timestamp: new Date().toISOString(), user: profile?.name || user.email };
      const now = new Date().toISOString();
      const updates: any = {
        updatedAt: serverTimestamp(),
        history: [...(ticket.history || []), historyEntry]
      };
      if (!ticket.firstResponseAt) {
        updates.firstResponseAt = now;
        updates.responseSlaStatus = "Completed";
      }
      const res = await fetch(\`/api/tickets/\${id}/activities\`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          activity_type: 'work_note',
          visibility_type: 'internal',
          created_by: user.uid,
          created_by_name: profile?.name || user.email,
          message: workNote
        })
      });
      if (!res.ok) throw new Error("Failed to save work note");
      await updateDoc(doc(db, "tickets", id), updates);
      setWorkNote("");
      setTimelineRefresh(prev => prev + 1);
      setMessage({ text: 'Work note added successfully', type: 'success' });
    } catch (error: any) { 
      console.error(error);
      setMessage({ text: error.message || 'Failed to add work note', type: 'error' });
    } finally {
      setIsPosting(false);
      setTimeout(() => setMessage(null), 4000);
    }
  };`;

code = code.replace(addWorkNoteOld, addWorkNoteNew);

// 5. Update right column
const timelineRegex = /\{\/\* Right Column: Activity Stream \*\/\}[\s\S]*?(?=\s*\) : activeTab === "Related Records"\))/m;
const timelineNew = `{/* Right Column: Activity Stream */}
              <div className="h-[600px]">
                <ActivityTimeline 
                  ticketId={id} 
                  createdAt={ticket.createdAt} 
                  refreshTrigger={timelineRefresh} 
                />
              </div>
            </div>`;
code = code.replace(timelineRegex, timelineNew);

// 6. Disable Post Comment Button
const buttonOld = `<Button 
                      type="button"
                      onClick={(e) => {
                        if (workNote.trim()) handleAddWorkNote(e);
                        if (newComment.trim()) handleAddComment(e);
                      }} 
                      className="bg-sn-green text-sn-dark font-bold gap-2 px-8 h-10 shadow-lg hover:shadow-sn-green/20"
                    >
                      <Send className="w-4 h-4" /> Post Comment
                    </Button>`;
const buttonNew = `<Button 
                      type="button"
                      disabled={isPosting}
                      onClick={(e) => {
                        if (workNote.trim()) handleAddWorkNote(e);
                        if (newComment.trim()) handleAddComment(e);
                      }} 
                      className={cn(
                        "font-bold gap-2 px-8 h-10 shadow-lg transition-all",
                        isPosting 
                          ? "bg-gray-400 text-white cursor-not-allowed" 
                          : "bg-sn-green text-sn-dark hover:shadow-sn-green/20"
                      )}
                    >
                      {isPosting ? (
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-1" />
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                      {isPosting ? 'Posting...' : 'Post Comment'}
                    </Button>`;
code = code.replace(buttonOld, buttonNew);

// 7. Add Toast Notification at bottom
const endFileOld = `        </div>
      )}
    </div>
  );
}`;
const endFileNew = `        </div>
      )}

      {/* ── Notification Toast ── */}
      <AnimatePresence>
        {message && (
          <motion.div 
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className={cn(
              "fixed bottom-8 right-8 px-8 py-4 rounded-[20px] shadow-2xl flex items-center gap-3 z-50 backdrop-blur-xl border font-black text-sm",
              message.type === 'success' ? "bg-green-500/10 text-green-500 border-green-500/20" : "bg-red-500/10 text-red-500 border-red-500/20"
            )}
          >
            {message.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
            {message.text}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}`;
code = code.replace(endFileOld, endFileNew);

fs.writeFileSync('src/pages/TicketDetail.tsx', code);
console.log('Update Complete.');
