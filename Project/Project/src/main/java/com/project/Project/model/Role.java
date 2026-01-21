package com.project.Project.model;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

public enum Role {
    admin,
    teacher,
    student;

    @JsonCreator
    public static Role fromValue(String value) {
        return Role.valueOf(value.toLowerCase());
    }

    @JsonValue
    public String toValue() {
        return this.name();
    }
}
