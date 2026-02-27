<?php

namespace App\Http\Controllers;

use App\Models\Tag;
use Illuminate\Http\Request;

class TagController extends Controller
{
    public function index()
    {
        return response()->json(Tag::all());
    }

    public function store(Request $request)
    {
        $this->authorize('create', Tag::class);

        $validated = $request->validate([
            'tag_name' => 'required|string|max:50',
        ]);
        $tag = Tag::create($validated);

        return response()->json($tag, 201);
    }

    public function update(Request $request, $id)
    {
        $tag = Tag::findOrFail($id);

        $this->authorize('update', $tag);

        $validated = $request->validate([
            'tag_name' => 'required|string|max:50',
        ]);
        $tag->update($validated);

        return response()->json($tag);
    }

    public function destroy($id)
    {
        $tag = Tag::findOrFail($id);

        $this->authorize('delete', $tag);

        // Prevent deletion if tag is linked to any expenses
        if ($tag->expenses()->exists()) {
            return response()->json([
                'message' => 'Cannot delete tag: it is still linked to one or more expenses.',
            ], 409);
        }
        try {
            $tag->delete();

            return response()->json(null, 204);
        } catch (\Illuminate\Database\QueryException $e) {
            return response()->json([
                'message' => 'Failed to delete tag.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}
