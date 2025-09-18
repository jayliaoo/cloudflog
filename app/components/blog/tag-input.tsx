import { useState, useEffect, useRef } from "react";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { X, Plus } from "lucide-react";

interface Tag {
  id: number;
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
        const data = await response.json();
        
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

        const data = await response.json();
        if (data.tag) {
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
          <Badge key={tag} variant="secondary" className="text-sm">
            {tag}
            <button
              type="button"
              onClick={() => removeTag(tag)}
              className="ml-1 hover:text-destructive"
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
      </div>
      
      <input
        ref={inputRef}
        type="text"
        value={inputValue}
        onChange={handleInputChange}
        onKeyDown={handleInputKeyDown}
        placeholder={selectedTags.length === 0 ? "Type to search or create tags..." : "Add more tags..."}
        className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
      />

      {showSuggestions && (
        <div 
          ref={suggestionsRef}
          className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-900 border border-input rounded-md shadow-lg max-h-60 overflow-y-auto"
        >
          {loading && (
            <div className="px-3 py-2 text-sm text-gray-600 dark:text-gray-400">
              Loading suggestions...
            </div>
          )}
          
          {!loading && suggestions.length === 0 && inputValue.trim() && (
            <div className="px-3 py-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="w-full justify-start"
                onClick={handleCreateNewTag}
              >
                <Plus className="mr-2 h-4 w-4" />
                Create new tag "{inputValue}"
              </Button>
            </div>
          )}

          {!loading && suggestions.map((tag) => (
            <button
              key={tag.id}
              type="button"
              className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-800 focus:bg-gray-100 dark:focus:bg-gray-800 focus:outline-none"
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