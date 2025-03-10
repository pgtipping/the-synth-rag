"use client";

import { useEffect, useState } from "react";
import {
  ExamplePrompt,
  PromptCategory,
  PromptQueryParams,
  CreateExamplePromptRequest,
  UpdateExamplePromptRequest,
} from "@/src/lib/types/prompts";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../ui/table";
import { Button } from "../../ui/button";
import { Badge } from "../../ui/badge";
import { Input } from "../../ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../ui/select";

interface PromptManagerProps {
  categories: PromptCategory[];
}

export function PromptManager({ categories }: PromptManagerProps) {
  const [prompts, setPrompts] = useState<ExamplePrompt[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [editingPrompt, setEditingPrompt] = useState<ExamplePrompt | null>(
    null
  );
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState<Partial<CreateExamplePromptRequest>>(
    {
      is_active: true,
      display_order: 0,
    }
  );

  const fetchPrompts = async (params: PromptQueryParams) => {
    setIsLoading(true);
    setError(null);
    try {
      const queryParams = new URLSearchParams();
      if (params.category_id)
        queryParams.set("category_id", params.category_id.toString());
      if (params.page) queryParams.set("page", params.page.toString());
      if (params.pageSize)
        queryParams.set("pageSize", params.pageSize.toString());

      const response = await fetch(`/api/prompts?${queryParams.toString()}`);
      if (!response.ok) {
        throw new Error("Failed to fetch prompts");
      }

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || "Failed to fetch prompts");
      }

      setPrompts(data.data.items);
      setTotalPages(data.data.totalPages);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPrompts({
      category_id: selectedCategory
        ? parseInt(selectedCategory, 10)
        : undefined,
      page: currentPage,
      pageSize: 10,
    });
  }, [selectedCategory, currentPage]);

  const handleCreate = async () => {
    try {
      const response = await fetch("/api/prompts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error("Failed to create prompt");
      }

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || "Failed to create prompt");
      }

      setIsCreating(false);
      setFormData({ is_active: true, display_order: 0 });
      fetchPrompts({
        category_id: selectedCategory
          ? parseInt(selectedCategory, 10)
          : undefined,
        page: currentPage,
        pageSize: 10,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    }
  };

  const handleUpdate = async (id: number, prompt: ExamplePrompt) => {
    try {
      const updates: UpdateExamplePromptRequest = {
        id,
        title: prompt.title,
        content: prompt.content,
        use_case: prompt.use_case,
        category_id: prompt.category_id,
        display_order: prompt.display_order,
        is_active: prompt.is_active,
        description: prompt.description || undefined,
      };

      const response = await fetch(`/api/prompts/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        throw new Error("Failed to update prompt");
      }

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || "Failed to update prompt");
      }

      setEditingPrompt(null);
      fetchPrompts({
        category_id: selectedCategory
          ? parseInt(selectedCategory, 10)
          : undefined,
        page: currentPage,
        pageSize: 10,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this prompt?")) {
      return;
    }

    try {
      const response = await fetch(`/api/prompts/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete prompt");
      }

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || "Failed to delete prompt");
      }

      fetchPrompts({
        category_id: selectedCategory
          ? parseInt(selectedCategory, 10)
          : undefined,
        page: currentPage,
        pageSize: 10,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    }
  };

  if (error) {
    return <div className="text-center text-red-500 py-4">Error: {error}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filter by category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Categories</SelectItem>
            {categories.map((category) => (
              <SelectItem key={category.id} value={category.id.toString()}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button onClick={() => setIsCreating(true)} disabled={isCreating}>
          Add New Prompt
        </Button>
      </div>

      {isCreating && (
        <div className="bg-gray-50 p-4 rounded-lg space-y-4">
          <h3 className="font-semibold">Create New Prompt</h3>
          <div className="grid grid-cols-2 gap-4">
            <Input
              placeholder="Title"
              value={formData.title || ""}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
            />
            <Select
              value={formData.category_id?.toString() || ""}
              onValueChange={(value) =>
                setFormData({ ...formData, category_id: parseInt(value, 10) })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id.toString()}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              placeholder="Use Case"
              value={formData.use_case || ""}
              onChange={(e) =>
                setFormData({ ...formData, use_case: e.target.value })
              }
            />
            <Input
              type="number"
              placeholder="Display Order"
              value={formData.display_order?.toString() || "0"}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  display_order: parseInt(e.target.value, 10),
                })
              }
            />
            <div className="col-span-2">
              <Input
                placeholder="Content"
                value={formData.content || ""}
                onChange={(e) =>
                  setFormData({ ...formData, content: e.target.value })
                }
              />
            </div>
            <div className="col-span-2">
              <Input
                placeholder="Description"
                value={formData.description || ""}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsCreating(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate}>Create</Button>
          </div>
        </div>
      )}

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Use Case</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Order</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {prompts.map((prompt) => (
              <TableRow key={prompt.id}>
                <TableCell>{prompt.title}</TableCell>
                <TableCell>
                  {categories.find((c) => c.id === prompt.category_id)?.name}
                </TableCell>
                <TableCell>{prompt.use_case}</TableCell>
                <TableCell>
                  <Badge variant={prompt.is_active ? "default" : "secondary"}>
                    {prompt.is_active ? "Active" : "Inactive"}
                  </Badge>
                </TableCell>
                <TableCell>{prompt.display_order}</TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditingPrompt(prompt)}
                    className="mr-2"
                  >
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(prompt.id)}
                  >
                    Delete
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <Button
            variant="outline"
            onClick={() => setCurrentPage(currentPage - 1)}
            disabled={currentPage === 1 || isLoading}
          >
            Previous
          </Button>
          <span className="py-2 px-4">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            variant="outline"
            onClick={() => setCurrentPage(currentPage + 1)}
            disabled={currentPage === totalPages || isLoading}
          >
            Next
          </Button>
        </div>
      )}

      {editingPrompt && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full space-y-4">
            <h3 className="font-semibold">Edit Prompt</h3>
            <div className="grid grid-cols-2 gap-4">
              <Input
                placeholder="Title"
                value={editingPrompt.title}
                onChange={(e) =>
                  setEditingPrompt({ ...editingPrompt, title: e.target.value })
                }
              />
              <Select
                value={editingPrompt.category_id.toString()}
                onValueChange={(value) =>
                  setEditingPrompt({
                    ...editingPrompt,
                    category_id: parseInt(value, 10),
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem
                      key={category.id}
                      value={category.id.toString()}
                    >
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                placeholder="Use Case"
                value={editingPrompt.use_case}
                onChange={(e) =>
                  setEditingPrompt({
                    ...editingPrompt,
                    use_case: e.target.value,
                  })
                }
              />
              <Input
                type="number"
                placeholder="Display Order"
                value={editingPrompt.display_order.toString()}
                onChange={(e) =>
                  setEditingPrompt({
                    ...editingPrompt,
                    display_order: parseInt(e.target.value, 10),
                  })
                }
              />
              <div className="col-span-2">
                <Input
                  placeholder="Content"
                  value={editingPrompt.content}
                  onChange={(e) =>
                    setEditingPrompt({
                      ...editingPrompt,
                      content: e.target.value,
                    })
                  }
                />
              </div>
              <div className="col-span-2">
                <Input
                  placeholder="Description"
                  value={editingPrompt.description || ""}
                  onChange={(e) =>
                    setEditingPrompt({
                      ...editingPrompt,
                      description: e.target.value,
                    })
                  }
                />
              </div>
              <Select
                value={editingPrompt.is_active.toString()}
                onValueChange={(value) =>
                  setEditingPrompt({
                    ...editingPrompt,
                    is_active: value === "true",
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Active</SelectItem>
                  <SelectItem value="false">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditingPrompt(null)}>
                Cancel
              </Button>
              <Button
                onClick={() => handleUpdate(editingPrompt.id, editingPrompt)}
              >
                Save Changes
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
