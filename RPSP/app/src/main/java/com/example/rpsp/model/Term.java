package com.example.rpsp.model;

public class Term {
    private Long id;
    private String name;
    private CrTerm crTerm;

    public Long getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public CrTerm getCrTerm() {
        return crTerm;
    }

    @Override
    public String toString() {
        if (crTerm != null && crTerm.getName() != null) {
            return crTerm.getName();
        }
        return name; // For Spinner display
    }
}
