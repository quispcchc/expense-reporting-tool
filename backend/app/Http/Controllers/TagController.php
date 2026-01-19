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
        $validated = $request->validate([
            'tag_name' => 'required|string|max:50',
        ]);
        $tag = Tag::create($validated);
        return response()->json($tag, 201);
    }

    public function update(Request $request, $id)
    {
        $tag = Tag::findOrFail($id);
        $validated = $request->validate([
            'tag_name' => 'required|string|max:50',
        ]);
        $tag->update($validated);
        return response()->json($tag);
    }

    public function destroy($id)
    {
        $tag = Tag::findOrFail($id);
        $tag->delete();
        return response()->json(null, 204);
    }
}
