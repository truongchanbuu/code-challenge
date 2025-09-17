const toDate = (v: any): Date | null =>
    v == null
        ? null
        : v instanceof Date
          ? v
          : typeof v?.toDate === "function"
            ? v.toDate()
            : null;
