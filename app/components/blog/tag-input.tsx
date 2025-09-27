import { useState, useEffect, useRef } from "react";
import { X, Plus } from "lucide-react";

interface Tag {
  name: string;
  slug: string;
}

interface TagInputProps {
  selectedTags: string[];
  onTagsChange: (tags: string[]) => void;
}

function TagInput({ selectedTags, onTagsChange }: TagInputProps) {
  const [inputValue, setInputValue] = useState("");
  const [suggestions, setSuggestions] = useState<Tag[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Fetch suggestions when input changes
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (inputValue.trim().length === 0) {
        setSuggestions([]);
        setShowSuggestions(false);
        return;
      }

      setLoading(true);
      try {
        const response = await fetch(`/api/tags?search=${encodeURIComponent(inputValue)}`);
        const data = await response.json<{ tags: Tag[] }>();
        
        if (data.tags) {
          // Filter out already selected tags
          const filteredSuggestions = data.tags.filter((tag: Tag) => 
            !selectedTags.some(selectedTag => selectedTag.toLowerCase() === tag.name.toLowerCase())
          );
          setSuggestions(filteredSuggestions);
          setShowSuggestions(true);
        }
      } catch (error) {
        console.error("Error fetching tag suggestions:", error);
      } finally {
        setLoading(false);
      }
    };

    const debounce = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(debounce);
  }, [inputValue, selectedTags]);

  // Handle clicks outside suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current && 
        !suggestionsRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (inputValue.trim()) {
        addTag(inputValue.trim());
      }
    } else if (e.key === "Backspace" && inputValue === "" && selectedTags && selectedTags.length > 0) {
      // Remove last tag when backspace is pressed on empty input
      removeTag(selectedTags[selectedTags.length - 1]);
    }
  };

  const addTag = async (tagName: string) => {
    const trimmedName = tagName.trim();
    if (!trimmedName || selectedTags.some(tag => tag.toLowerCase() === trimmedName.toLowerCase())) {
      return;
    }

    // Check if tag exists in suggestions
    const existingSuggestion = suggestions.find(suggestion => 
      suggestion.name.toLowerCase() === trimmedName.toLowerCase()
    );

    if (existingSuggestion) {
      // Use existing tag
      const newTags = [...selectedTags, existingSuggestion.name];
      onTagsChange(newTags);
    } else {
      // Create new tag
      try {
        const formData = new FormData();
        formData.append("name", trimmedName);

        const response = await fetch("/api/tags", {
          method: "POST",
          body: formData
        });

        const data = await response.json<{ tag?: Tag; error?: string }>();        if (data.tag) {
          const newTags = [...selectedTags, data.tag.name];
          onTagsChange(newTags);
        } else if (data.error) {
          console.error("Error creating tag:", data.error);
          // Still add the tag name even if creation failed
          const newTags = [...selectedTags, trimmedName];
          onTagsChange(newTags);
        }
      } catch (error) {
        console.error("Error creating tag:", error);
        // Still add the tag name even if creation failed
        const newTags = [...selectedTags, trimmedName];
        onTagsChange(newTags);
      }
    }

    setInputValue("");
    setShowSuggestions(false);
  };

  const removeTag = (tagToRemove: string) => {
    const newTags = selectedTags.filter(tag => tag !== tagToRemove);
    onTagsChange(newTags);
  };

  const handleSuggestionClick = (tag: Tag) => {
    addTag(tag.name);
  };

  const handleCreateNewTag = () => {
    if (inputValue.trim()) {
      addTag(inputValue.trim());
    }
  };

  return (
    <div className="relative">
      <div className="flex flex-wrap gap-2 mb-2">
        {selectedTags && selectedTags.map((tag) => (
          <span key={tag} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-secondary text-secondary-foreground">
            {tag}
            <button
              type="button"
              onClick={() => removeTag(tag)}
              className="ml-1 hover:text-destructive"
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
      </div>
      
      <input
        ref={inputRef}
        type="text"
        value={inputValue}
        onChange={handleInputChange}
        onKeyDown={handleInputKeyDown}
        placeholder={selectedTags.length === 0 ? "Type to search or create tags..." : "Add more tags..."}
        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
      />

      {showSuggestions && (
        <div 
          ref={suggestionsRef}
          className="absolute z-10 w-full mt-1 bg-background border border-input rounded-md shadow-lg max-h-60 overflow-y-auto"
        >
          {loading && (
            <div className="px-3 py-2 text-sm text-muted-foreground">
                Loading suggestions...
              </div>
          )}
          
          {!loading && suggestions.length === 0 && inputValue.trim() && (
            <div className="px-3 py-2">
              <button
                type="button"
                className="w-full justify-start flex items-center px-3 py-2 text-sm text-left hover:bg-accent focus:bg-accent focus:outline-none rounded-md"
                onClick={handleCreateNewTag}
              >
                <Plus className="mr-2 h-4 w-4" />
                Create new tag "{inputValue}"
              </button>
            </div>
          )}

          {!loading && suggestions.map((tag) => (
            <button
              key={tag.slug}
              type="button"
              className="w-full px-3 py-2 text-left text-sm hover:bg-accent focus:bg-accent focus:outline-none"
              onClick={() => handleSuggestionClick(tag)}
            >
              {tag.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default TagInput;