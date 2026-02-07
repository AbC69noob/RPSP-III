package com.example.rpsp.model;

public class Term {
    private Long id;
    private String name;

    public Long getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    @Override
    public String toString() {
        return name; // For Spinner display
    }
}
