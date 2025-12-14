import React, { useState, useEffect, useMemo } from 'react';
import { Search, LayoutGrid, Layers, LogIn } from 'lucide-react';
import { supabase } from '../services/supabaseClient';
import Modal from '../components/Modal';
import { PromptEntry, Tag } from '../types';
import { Link } from 'react-router-dom';

const Home: React.FC = () => {
    const [prompts, setPrompts] = useState<PromptEntry[]>([]);
    const [availableTags, setAvailableTags] = useState<Tag[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<string>('All');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedEntry, setSelectedEntry] = useState<PromptEntry | null>(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const { data: promptsData, error: promptsError } = await supabase
                .from('prompts')
                .select('*')
                .order('created_at', { ascending: false });

            if (promptsError) throw promptsError;
            if (promptsData) setPrompts(promptsData);

            const { data: tagsData, error: tagsError } = await supabase
                .from('tags')
                .select('*')
                .order('name', { ascending: true });

            if (tagsError) throw tagsError;
            if (tagsData) setAvailableTags(tagsData);
        } catch (error) {
            console.error("Failed to load data:", error);
        }
    };

    const filteredPrompts = useMemo(() => {
        return prompts.filter(p => {
            const matchesCategory = selectedCategory === 'All' || p.tags.includes(selectedCategory);
            const searchLower = searchQuery.toLowerCase();
            const matchesSearch =
                p.original_prompt.toLowerCase().includes(searchLower) ||
                p.translated_prompt.toLowerCase().includes(searchLower) ||
                p.summary.toLowerCase().includes(searchLower);

            return matchesCategory && matchesSearch;
        });
    }, [prompts, selectedCategory, searchQuery]);

    return (
        <div className="min-h-screen pb-20">
            {/* Header */}
            <header className="bg-white border-b border-gray-100 pt-12 pb-8 mb-8">
                <div className="max-w-7xl mx-auto px-6 text-center relative">
                    <Link to="/admin" className="absolute right-6 top-12 text-gray-400 hover:text-gray-600 transition-colors">
                        <LogIn size={20} />
                    </Link>
                    <h1 className="text-4xl font-extrabold text-gray-900 mb-3 tracking-tight">
                        Nano Banana Pro <span className="text-gray-400 font-normal">Prompt Library</span>
                    </h1>
                    <p className="text-gray-500 max-w-2xl mx-auto text-sm">
                        AI-powered prompt management. Auto-translate, summarize, and organize your creative assets in one place.
                    </p>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-6">
                {/* Filters Toolbar */}
                <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-8 sticky top-4 z-30 bg-[#f8f9fa]/90 backdrop-blur-md p-2 rounded-xl border border-gray-100/50 shadow-sm">

                    {/* Category Tabs */}
                    <div className="flex items-center gap-1 overflow-x-auto no-scrollbar w-full md:w-auto px-1">
                        <button
                            onClick={() => setSelectedCategory('All')}
                            className={`px-4 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${selectedCategory === 'All' ? 'bg-gray-900 text-white shadow-md' : 'text-gray-600 hover:bg-gray-200'
                                }`}
                        >
                            All
                        </button>
                        {availableTags.map(tag => (
                            <button
                                key={tag.id}
                                onClick={() => setSelectedCategory(tag.name)}
                                className={`px-4 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${selectedCategory === tag.name ? 'bg-gray-900 text-white shadow-md' : 'text-gray-600 hover:bg-gray-200'
                                    }`}
                            >
                                {tag.name}
                            </button>
                        ))}
                    </div>

                    {/* Search & Meta */}
                    <div className="flex items-center gap-3 w-full md:w-auto">
                        <div className="relative flex-1 md:w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                            <input
                                type="text"
                                placeholder="Search prompts..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-9 pr-4 py-2 rounded-lg border border-gray-200 bg-white text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all"
                            />
                        </div>
                        <div className="hidden md:flex items-center gap-2 px-3 py-2 bg-white rounded-lg border border-gray-200 text-xs text-gray-500 font-medium">
                            <Layers size={14} />
                            <span>{filteredPrompts.length} results</span>
                        </div>
                    </div>
                </div>

                {/* Masonry Gallery */}
                <div className="columns-2 md:columns-3 lg:columns-4 gap-6 space-y-6">
                    {filteredPrompts.map(entry => (
                        <div
                            key={entry.id}
                            className="break-inside-avoid bg-white rounded-xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer group"
                            onClick={() => setSelectedEntry(entry)}
                        >
                            {entry.image_url ? (
                                <div className="relative">
                                    <img src={entry.image_url} alt={entry.summary} className="w-full h-auto object-cover" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                                        <p className="text-white text-sm font-medium line-clamp-2">{entry.summary}</p>
                                        <div className="flex gap-2 mt-2">
                                            {entry.tags.slice(0, 2).map(t => (
                                                <span key={t} className="text-[10px] bg-white/20 text-white px-2 py-0.5 rounded backdrop-blur-sm">#{t}</span>
                                            ))}
                                        </div>
                                    </div>
                                    {/* Aspect Ratio Badge */}
                                    <div className="absolute top-2 right-2 bg-black/50 backdrop-blur-md text-white text-[10px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                                        {entry.aspect_ratio}
                                    </div>
                                </div>
                            ) : (
                                <div className="p-6 min-h-[160px] flex flex-col justify-between bg-gradient-to-br from-blue-50 to-indigo-50">
                                    <p className="text-gray-800 text-sm font-medium line-clamp-4 leading-relaxed">
                                        "{entry.original_prompt}"
                                    </p>
                                    <div className="flex gap-2 mt-4">
                                        {entry.tags.slice(0, 2).map(t => (
                                            <span key={t} className="text-[10px] bg-white text-blue-600 border border-blue-100 px-2 py-0.5 rounded">#{t}</span>
                                        ))}
                                    </div>
                                </div>
                            )}


                        </div>
                    ))}
                </div>

                {filteredPrompts.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                        <LayoutGrid size={48} className="mb-4 opacity-20" />
                        <p>No prompts found.</p>
                    </div>
                )}

            </main>

            {selectedEntry && (
                <Modal entry={selectedEntry} onClose={() => setSelectedEntry(null)} />
            )}
        </div>
    );
};

export default Home;
