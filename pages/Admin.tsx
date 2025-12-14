import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import InputArea from '../components/InputArea';
import { PromptEntry, Tag } from '../types';
import { LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Admin: React.FC = () => {
    const [availableTags, setAvailableTags] = useState<Tag[]>([]);
    const navigate = useNavigate();

    useEffect(() => {
        fetchTags();
    }, []);

    const fetchTags = async () => {
        const { data, error } = await supabase
            .from('tags')
            .select('*')
            .order('name', { ascending: true });

        if (error) console.error('Error fetching tags:', error);
        if (data) setAvailableTags(data);
    };

    const handleAddPrompt = async (entry: Omit<PromptEntry, 'id' | 'created_at'>) => {
        try {
            const { error } = await supabase
                .from('prompts')
                .insert([entry]);

            if (error) throw error;
            alert('Prompt saved successfully!');
        } catch (error) {
            console.error("Failed to save prompt:", error);
            alert("Failed to save prompt to database.");
        }
    };

    const handleAddTag = async (tagName: string) => {
        if (!availableTags.find(t => t.name.toLowerCase() === tagName.toLowerCase())) {
            try {
                const { data, error } = await supabase
                    .from('tags')
                    .insert([{ name: tagName }])
                    .select()
                    .single();

                if (error) throw error;
                if (data) {
                    setAvailableTags(prev => [...prev, data]);
                }
            } catch (error) {
                console.error("Failed to add tag:", error);
            }
        }
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        navigate('/login');
    };

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-4xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
                    >
                        <LogOut size={18} />
                        Logout
                    </button>
                </div>

                <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
                    <h2 className="text-xl font-semibold mb-6">Add New Prompt</h2>
                    <InputArea
                        availableTags={availableTags}
                        onAddTag={handleAddTag}
                        onSave={handleAddPrompt}
                    />
                </div>
            </div>
        </div>
    );
};

export default Admin;
