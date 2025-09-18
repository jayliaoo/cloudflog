import { useState, useEffect } from "react";
import { Label } from "~/components/ui/label";
import { Select, SelectOption } from "~/components/ui/select";

interface Category {
  id: number;
  name: string;
  slug: string;
}

interface CategoryDropdownProps {
  selectedCategoryId: number | null;
  onCategoryChange: (categoryId: number | null) => void;
}

export default function CategoryDropdown({ selectedCategoryId, onCategoryChange }: CategoryDropdownProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch categories on component mount
  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch("/api/categories");
      const data = await response.json();
      
      if (response.ok) {
        setCategories(data.categories);
      } else {
        setError(data.error || "Failed to fetch categories");
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
      setError("Failed to fetch categories");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    const categoryId = value === "" ? null : parseInt(value, 10);
    onCategoryChange(categoryId);
  };

  if (loading) {
    return (
      <div>
        <Label htmlFor="category">Category</Label>
        <Select id="category" disabled>
          <SelectOption value="">Loading categories...</SelectOption>
        </Select>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <Label htmlFor="category">Category</Label>
        <div className="text-destructive text-sm mt-1">{error}</div>
      </div>
    );
  }

  return (
    <div>
      <Label htmlFor="category">Category</Label>
      <Select
        id="category"
        value={selectedCategoryId?.toString() || ""}
        onChange={handleChange}
      >
        <SelectOption value="">Select a category...</SelectOption>
        {categories.map((category) => (
          <SelectOption key={category.id} value={category.id.toString()}>
            {category.name}
          </SelectOption>
        ))}
      </Select>
    </div>
  );
}